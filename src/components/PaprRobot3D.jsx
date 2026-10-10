import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// 7-Step Pick and Place Sequence based on user specification and technical documentation
export const STAGES = [
  {
    id: 'move',
    label: '1. Move to Object',
    time: 0.0,
    heading: 'Position Directly Above Object',
    desc: 'RKI 1 (BASE) rotates to -45° while RKI 2 (SHOULDER) and RKI 3 (ELBOW) articulate into position, placing the vertical slide and claw directly above the workpiece.',
    specs: { 'Base Yaw (RKI 1)': '-45°', 'Shoulder (RKI 2)': '47°', 'Elbow (RKI 3)': '37°', 'Vertical Slide': 'Retracted (Top)' }
  },
  {
    id: 'descend',
    label: '2. Descend to Height',
    time: 0.18,
    heading: 'Vertical Slide Downward Extension',
    desc: 'The vertical arm segment moves downward, bringing the claw from clearance height down to the exact physical height of the target workpiece.',
    specs: { 'Descent Stroke': '-96 mm', 'Target Height': 'Y = 1.16', 'Claw Jaws': 'Opening (MG90S)', 'Approach': 'Direct Vertical' }
  },
  {
    id: 'grip',
    label: '3. Open & Grip Object',
    time: 0.35,
    heading: 'Claw Clamps Workpiece',
    desc: 'The claw fingers visibly open before contact, surround the object on the pick station, and close tightly via the MG90S pincer linkage to securely capture the payload.',
    specs: { 'Claw Status': 'Clamped 100%', 'MG90S Angle': 'Closed (18°)', 'Attachment': 'Physically Locked', 'Payload': 'Secured' }
  },
  {
    id: 'lift',
    label: '4. High-Torque Lift',
    time: 0.50,
    heading: 'Vertical Lift with Carried Object',
    desc: 'The vertical arm segment rises, lifting the claw and clamped workpiece clear of the pick fixture. The object remains securely aligned between the fingers.',
    specs: { 'Lift Height': '+96 mm', 'Payload Status': 'Locked to Claw', 'Driving Servos': 'MG996R & MG90S', 'Clearance': 'Verified' }
  },
  {
    id: 'transport',
    label: '5. Workspace Transport',
    time: 0.68,
    heading: 'Spatial Arc Transfer Across Workspace',
    desc: 'RKI 1 (BASE) sweeps across from -45° to +45° to carry the held workpiece across the 3D workspace to the sorting destination without slipping or floating.',
    specs: { 'Base Yaw (RKI 1)': '+45° (Sort Target)', 'Transfer Path': 'Smooth S-Curve', 'Payload Stability': 'Maintained', 'Slip Risk': 'Zero' }
  },
  {
    id: 'release',
    label: '6. Lower & Release',
    time: 0.85,
    heading: 'Descent to Destination & Release',
    desc: 'The claw descends vertically to the sorting point height, opens its jaws to deposit the workpiece into the sorted bin, and then lifts away.',
    specs: { 'Destination': 'Sorting Station B', 'Descent Stroke': '-96 mm', 'Claw Jaws': 'Open (MG90S 70°)', 'Payload Status': 'Deposited' }
  },
  {
    id: 'repeat',
    label: '7. Reset & Repeat',
    time: 1.0,
    heading: 'Return to Pick Cycle',
    desc: 'The vertical segment lifts away clear of the sorted payload, the arm returns to the pick location, and preps the next continuous cycle.',
    specs: { 'Slide Status': 'Ascended', 'Cycle Counter': 'Continuous Loop', 'Controller': 'ESP32 DevKit V1', 'Next Object': 'Ready' }
  }
]

export default function PaprRobot3D({ theme = 'light', externalScrollProgress = null }) {
  const mountRef = useRef(null)
  const controlsRef = useRef(null)
  const animFrameRef = useRef(null)
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false
    }
    return true
  })
  const isPlayingRef = useRef(true)
  const [viewMode, setViewMode] = useState('3d') // '3d' | 'cad-overlay'
  const [telemetry, setTelemetry] = useState({ yaw: '-45°', shoulder: '47°', elbow: '37°', slide: '0 mm', claw: 'Ready' })

  // Kinematic joints refs
  const kinematicRefs = useRef({
    baseTurntable: null,
    shoulderJoint: null,
    elbowJoint: null,
    wristJoint: null,
    verticalSlide: null,
    leftClaw: null,
    rightClaw: null,
    gripAnchor: null,
    payload: null,
    pickStationPos: new THREE.Vector3(-1.359, 1.16, 1.359),
    sortStationPos: new THREE.Vector3(1.359, 1.16, 1.359)
  })

  const progressRef = useRef(0)
  progressRef.current = progress

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  // Sync scroll progress from outer page scroll only if paused or scrolling
  useEffect(() => {
    if (externalScrollProgress !== null && !isPlayingRef.current) {
      setProgress(externalScrollProgress)
    }
  }, [externalScrollProgress])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(theme === 'dark' ? 0x0a1f2f : 0xeef3f6, 0.035)

    // Camera with mobile-first framing: expands FOV on narrow screens so arm & claw never clip
    const initialFov = width < 560 ? 52 : (width < 900 ? 46 : 40)
    const camera = new THREE.PerspectiveCamera(initialFov, width / height, 0.1, 100)
    camera.position.set(4.0, 3.4, 4.8)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.18
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 - 0.04
    controls.minDistance = 2.0
    controls.maxDistance = 9.5
    controls.target.set(0, 1.25, 0.3)
    controlsRef.current = controls

    // Lighting
    const ambientLight = new THREE.AmbientLight(theme === 'dark' ? 0x243e56 : 0xd8e6ef, 1.6)
    scene.add(ambientLight)

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.4)
    mainLight.position.set(5, 8, 4)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 1024
    mainLight.shadow.mapSize.height = 1024
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 20
    mainLight.shadow.camera.left = -3.5
    mainLight.shadow.camera.right = 3.5
    mainLight.shadow.camera.top = 3.5
    mainLight.shadow.camera.bottom = -3.5
    mainLight.shadow.bias = -0.0005
    scene.add(mainLight)

    const cyanRim = new THREE.PointLight(0x06b6d4, 2.8, 9)
    cyanRim.position.set(-2.5, 3.0, -1.5)
    scene.add(cyanRim)

    const fillLight = new THREE.DirectionalLight(0xa5d8ff, 0.9)
    fillLight.position.set(-4, 4, -2)
    scene.add(fillLight)

    // Materials based on technical documentation
    // 1. Two wooden plates (300 mm x 300 mm x 10 mm)
    const woodPlateMat = new THREE.MeshStandardMaterial({
      color: theme === 'dark' ? 0x3d2b1f : 0xba9a7a,
      roughness: 0.75,
      metalness: 0.05,
      name: 'wood_base'
    })

    // 2. 26 mm x 26 mm aluminium channels
    const alumChannelMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.88,
      roughness: 0.28,
      name: 'aluminium_26mm'
    })

    // 3. 2 mm and 4 mm metal sheets (brackets)
    const metalSheetMat = new THREE.MeshStandardMaterial({
      color: 0x263238,
      metalness: 0.65,
      roughness: 0.45,
      name: 'metal_sheets'
    })

    // 4. MG996R servo motor housing
    const servoMg996Mat = new THREE.MeshStandardMaterial({
      color: 0x11161b,
      metalness: 0.45,
      roughness: 0.4,
      name: 'mg996r'
    })

    // 5. MG90S micro-servo motor housing
    const servoMg90sMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Distinctive blue casing of MG90S
      metalness: 0.35,
      roughness: 0.35,
      name: 'mg90s'
    })

    const brassGearMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.25
    })

    const cyanGlowMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 1.8,
      roughness: 0.1,
      metalness: 0.2,
      name: 'cyanLink'
    })

    const clawRubberMat = new THREE.MeshStandardMaterial({
      color: 0x22262c,
      roughness: 0.85,
      metalness: 0.1,
      name: 'claw'
    })

    const payloadMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Bright metallic gold/orange workpiece block
      metalness: 0.85,
      roughness: 0.25,
      name: 'payload'
    })

    // Ground Grid
    const grid = new THREE.GridHelper(12, 24, 0x06b6d4, theme === 'dark' ? 0x1a384d : 0xc7d6df)
    grid.position.y = -0.01
    scene.add(grid)

    // -------------------------------------------------------------------------
    // BUILD PHYSICAL MODEL FROM "PAPR technical documentation.pdf"
    // -------------------------------------------------------------------------
    const robotRoot = new THREE.Group()
    scene.add(robotRoot)

    // 1. Two Wooden Base Plates (300 mm x 300 mm x 10 mm)
    // Scale: 300 mm -> 3.0 units, 10 mm -> 0.1 units
    const tableGroup = new THREE.Group()
    robotRoot.add(tableGroup)

    // Top wooden plate (300 mm x 300 mm x 10 mm) at y = 1.05
    const topPlateGeo = new THREE.BoxGeometry(3.0, 0.10, 3.0)
    const topPlate = new THREE.Mesh(topPlateGeo, woodPlateMat)
    topPlate.position.y = 1.00
    topPlate.receiveShadow = true
    topPlate.castShadow = true
    tableGroup.add(topPlate)

    // Bottom wooden plate (300 mm x 300 mm x 10 mm) at y = 0.15
    const bottomPlate = new THREE.Mesh(topPlateGeo, woodPlateMat)
    bottomPlate.position.y = 0.15
    bottomPlate.receiveShadow = true
    bottomPlate.castShadow = true
    tableGroup.add(bottomPlate)

    // 4 Corner Legs (26 mm x 26 mm Aluminium Channels)
    const legGeo = new THREE.BoxGeometry(0.26, 0.80, 0.26)
    const legPositions = [
      [-1.37, 0.55, -1.37],
      [1.37, 0.55, -1.37],
      [-1.37, 0.55, 1.37],
      [1.37, 0.55, 1.37]
    ]
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, alumChannelMat)
      leg.position.set(...pos)
      leg.castShadow = true
      leg.receiveShadow = true
      tableGroup.add(leg)
    })

    // Corner brackets from 2 mm / 4 mm metal sheets with bolts
    const bracketGeo = new THREE.BoxGeometry(0.28, 0.22, 0.04)
    legPositions.forEach(pos => {
      const b = new THREE.Mesh(bracketGeo, metalSheetMat)
      b.position.set(pos[0], 0.92, pos[2] > 0 ? pos[2] + 0.13 : pos[2] - 0.13)
      tableGroup.add(b)
    })

    // Stations
    // Pick Station at x = -1.359, z = 1.359 (exactly aligned with arm reach at -45 deg)
    const pickStationPos = new THREE.Vector3(-1.359, 1.05, 1.359)
    const sortStationPos = new THREE.Vector3(1.359, 1.05, 1.359)

    const stationPedestalGeo = new THREE.CylinderGeometry(0.42, 0.45, 0.08, 32)
    const pickPedestal = new THREE.Mesh(stationPedestalGeo, metalSheetMat)
    pickPedestal.position.copy(pickStationPos)
    pickPedestal.receiveShadow = true
    tableGroup.add(pickPedestal)

    const pickRing = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.35, 32), new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide }))
    pickRing.rotation.x = -Math.PI / 2
    pickRing.position.set(pickStationPos.x, pickStationPos.y + 0.045, pickStationPos.z)
    tableGroup.add(pickRing)

    // Sort Station at x = 1.359, z = 1.359 (aligned at +45 deg)
    const sortPedestal = new THREE.Mesh(stationPedestalGeo, new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.4, metalness: 0.6 }))
    sortPedestal.position.copy(sortStationPos)
    sortPedestal.receiveShadow = true
    tableGroup.add(sortPedestal)

    const sortRing = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.36, 32), new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide }))
    sortRing.rotation.x = -Math.PI / 2
    sortRing.position.set(sortStationPos.x, sortStationPos.y + 0.045, sortStationPos.z)
    tableGroup.add(sortRing)

    // Target Workpiece Object (size 0.22 x 0.22 x 0.22 cube, resting at y = 1.16)
    const payloadGroup = new THREE.Group()
    const payloadGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22)
    const payloadMesh = new THREE.Mesh(payloadGeo, payloadMat)
    payloadMesh.castShadow = true
    payloadMesh.receiveShadow = true
    payloadGroup.add(payloadMesh)
    payloadGroup.position.set(pickStationPos.x, 1.16, pickStationPos.z)
    scene.add(payloadGroup)

    // 2. ROBOTIC ARM ASSEMBLY
    // Centrally mounted base plate on top wooden plate
    const baseMountPlateGeo = new THREE.BoxGeometry(0.70, 0.05, 0.70)
    const baseMountPlate = new THREE.Mesh(baseMountPlateGeo, metalSheetMat)
    baseMountPlate.position.set(0, 1.075, 0)
    baseMountPlate.castShadow = true
    tableGroup.add(baseMountPlate)

    // RKI 1 (BASE) — Base Turntable Group (Yaw rotation around Y)
    const baseTurntable = new THREE.Group()
    baseTurntable.position.set(0, 1.05, 0)
    robotRoot.add(baseTurntable)

    // RKI 1 (BASE) Servo Housing (MG996R)
    const baseServoBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.22), servoMg996Mat)
    baseServoBody.position.set(0, 0.16, 0)
    baseTurntable.add(baseServoBody)

    const baseHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), brassGearMat)
    baseHorn.position.set(0, 0.32, 0)
    baseTurntable.add(baseHorn)

    // Upright U-bracket fork holding shoulder joint
    const forkLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.26), metalSheetMat)
    forkLeft.position.set(-0.16, 0.50, 0)
    forkLeft.castShadow = true
    baseTurntable.add(forkLeft)

    const forkRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.26), metalSheetMat)
    forkRight.position.set(0.16, 0.50, 0)
    forkRight.castShadow = true
    baseTurntable.add(forkRight)

    // RKI 2 (SHOULDER) Servo Housing (MG996R)
    const shoulderServoBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.22), servoMg996Mat)
    shoulderServoBody.position.set(0.24, 0.52, 0)
    shoulderServoBody.castShadow = true
    baseTurntable.add(shoulderServoBody)

    // RKI 2 (SHOULDER) Joint Pivot (θ₁)
    const shoulderJoint = new THREE.Group()
    shoulderJoint.position.set(0, 0.55, 0)
    baseTurntable.add(shoulderJoint)

    const shoulderPin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.38, 16), brassGearMat)
    shoulderPin.rotation.z = Math.PI / 2
    shoulderJoint.add(shoulderPin)

    // Link 1 (l₁) — 26 mm x 26 mm Aluminium Channel Section (length = 1.20)
    const lowerArmGroup = new THREE.Group()
    shoulderJoint.add(lowerArmGroup)

    const lowerArmChannel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.20, 0.14), alumChannelMat)
    lowerArmChannel.position.set(0, 0.60, 0)
    lowerArmChannel.castShadow = true
    lowerArmGroup.add(lowerArmChannel)

    // Reinforcement plates (2 mm / 4 mm metal sheets)
    const sidePlateGeo = new THREE.BoxGeometry(0.20, 0.30, 0.16)
    const sidePlateBottom = new THREE.Mesh(sidePlateGeo, metalSheetMat)
    sidePlateBottom.position.set(0, 0.18, 0)
    lowerArmGroup.add(sidePlateBottom)

    const sidePlateTop = new THREE.Mesh(sidePlateGeo, metalSheetMat)
    sidePlateTop.position.set(0, 1.02, 0)
    lowerArmGroup.add(sidePlateTop)

    // RKI 3 (ELBOW) Joint Pivot (θ₂)
    const elbowJoint = new THREE.Group()
    elbowJoint.position.set(0, 1.20, 0)
    lowerArmGroup.add(elbowJoint)

    const elbowBracket = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.24), metalSheetMat)
    elbowBracket.position.set(0, 0.04, 0)
    elbowBracket.castShadow = true
    elbowJoint.add(elbowBracket)

    // RKI 3 (ELBOW) Servo Housing (MG996R)
    const elbowServo = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 0.20), servoMg996Mat)
    elbowServo.position.set(-0.16, 0.06, 0)
    elbowServo.castShadow = true
    elbowJoint.add(elbowServo)

    // Cyan Guide Link (as in user CAD model & documentation)
    const cyanLinkMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.58, 24), cyanGlowMat)
    cyanLinkMesh.rotation.x = Math.PI / 2
    cyanLinkMesh.position.set(0.12, 0.06, 0.26)
    cyanLinkMesh.castShadow = true
    elbowJoint.add(cyanLinkMesh)

    // Link 2 (l₂) — 26 mm x 26 mm Aluminium Channel Forearm (length = 1.05)
    const forearmGroup = new THREE.Group()
    elbowJoint.add(forearmGroup)

    const forearmChannel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.05, 0.12), alumChannelMat)
    forearmChannel.position.set(0, 0.525, 0)
    forearmChannel.castShadow = true
    forearmGroup.add(forearmChannel)

    // RKI 4 (WRIST) Joint (θ₃)
    const wristJoint = new THREE.Group()
    wristJoint.position.set(0, 1.05, 0)
    forearmGroup.add(wristJoint)

    // RKI 4 (WRIST) Servo Housing (MG90S)
    const mg90sBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.12), servoMg90sMat)
    mg90sBody.position.set(0, 0.08, 0.06)
    mg90sBody.castShadow = true
    wristJoint.add(mg90sBody)

    // Vertical Guide Column on Wrist
    const verticalGuideColumn = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.70, 0.12), alumChannelMat)
    verticalGuideColumn.position.set(0, -0.15, 0)
    wristJoint.add(verticalGuideColumn)

    // Vertical Slide Group (moves downward along Y to reach object height)
    const verticalSlide = new THREE.Group()
    wristJoint.add(verticalSlide)

    // Gripper Base & MG90S pincer actuator on vertical slide
    const gripperBaseGroup = new THREE.Group()
    gripperBaseGroup.position.set(0, 0, 0)
    verticalSlide.add(gripperBaseGroup)

    const gripperBackplate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.20), metalSheetMat)
    gripperBackplate.position.set(0, -0.03, 0)
    gripperBaseGroup.add(gripperBackplate)

    // Left Claw Finger (Articulated Linkage)
    const leftClaw = new THREE.Group()
    leftClaw.position.set(-0.09, -0.06, 0)
    gripperBaseGroup.add(leftClaw)

    const fingerGeo = new THREE.BoxGeometry(0.05, 0.34, 0.07)
    const leftFinger1 = new THREE.Mesh(fingerGeo, metalSheetMat)
    leftFinger1.position.set(-0.04, -0.16, 0)
    leftFinger1.rotation.z = 0.25
    leftFinger1.castShadow = true
    leftClaw.add(leftFinger1)

    const tipGeo = new THREE.BoxGeometry(0.04, 0.16, 0.06)
    const leftTip = new THREE.Mesh(tipGeo, clawRubberMat)
    leftTip.position.set(0.03, -0.32, 0)
    leftTip.rotation.z = -0.4
    leftClaw.add(leftTip)

    // Right Claw Finger (Articulated Linkage)
    const rightClaw = new THREE.Group()
    rightClaw.position.set(0.09, -0.06, 0)
    gripperBaseGroup.add(rightClaw)

    const rightFinger1 = new THREE.Mesh(fingerGeo, metalSheetMat)
    rightFinger1.position.set(0.04, -0.16, 0)
    rightFinger1.rotation.z = -0.25
    rightFinger1.castShadow = true
    rightClaw.add(rightFinger1)

    const rightTip = new THREE.Mesh(tipGeo, clawRubberMat)
    rightTip.position.set(-0.03, -0.32, 0)
    rightTip.rotation.z = 0.4
    rightClaw.add(rightTip)

    // Exact grip anchor between the rubber pads at fingertip center
    const gripAnchor = new THREE.Group()
    gripAnchor.position.set(0, -0.40, 0)
    verticalSlide.add(gripAnchor)

    // Store refs
    kinematicRefs.current = {
      baseTurntable,
      shoulderJoint,
      elbowJoint,
      wristJoint,
      verticalSlide,
      leftClaw,
      rightClaw,
      gripAnchor,
      payload: payloadGroup,
      pickStationPos: new THREE.Vector3(-1.359, 1.16, 1.359),
      sortStationPos: new THREE.Vector3(1.359, 1.16, 1.359)
    }

    // Set initial pose
    applyKinematics(0)

    // Animation Loop
    let lastTime = performance.now()
    const tempVec = new THREE.Vector3()

    const animate = (time) => {
      animFrameRef.current = requestAnimationFrame(animate)
      const delta = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time

      // Auto cycle when playing
      if (isPlayingRef.current) {
        setProgress(p => {
          let next = p + delta * 0.11
          if (next >= 1.0) next = 0.0
          return next
        })
      }

      // Compute exact positions and apply kinematic transforms
      applyKinematics(progressRef.current, tempVec)

      // Pulsing cyan indicator link
      cyanGlowMat.emissiveIntensity = 1.4 + Math.sin(time * 0.005) * 0.6

      controls.update()
      renderer.render(scene, camera)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    const onResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.fov = w < 560 ? 52 : (w < 900 ? 46 : 40)
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [theme])

  // Complete Forward Kinematics, Vertical Descent & Rigid Object Attachment
  const applyKinematics = (p, tempVec = new THREE.Vector3()) => {
    const {
      baseTurntable,
      shoulderJoint,
      elbowJoint,
      wristJoint,
      verticalSlide,
      leftClaw,
      rightClaw,
      gripAnchor,
      payload,
      pickStationPos,
      sortStationPos
    } = kinematicRefs.current

    if (!baseTurntable || !shoulderJoint || !elbowJoint || !wristJoint || !verticalSlide || !leftClaw || !rightClaw) return

    const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t))
    const smooth = (t) => {
      const c = Math.max(0, Math.min(1, t))
      return c * c * (3 - 2 * c)
    }

    // Kinematic joint angles from technical equations
    const s = 0.82 // θ₁ (Shoulder) = 47°
    const e = 0.65 // θ₂ (Elbow) = 37°
    const w = -(s + e) // θ₃ (Wrist) orienting the vertical slide strictly vertical

    shoulderJoint.rotation.x = s
    elbowJoint.rotation.x = e
    wristJoint.rotation.x = w

    const pickYaw = -0.785398 // -45° to Pick Station
    const sortYaw = 0.785398  // +45° to Sorting Station
    const maxDescent = 0.9643 // Exact stroke required to reach workpiece at Y = 1.16

    let baseYaw = pickYaw
    let slideY = 0.0
    let clawSpread = 0.05
    let isCarrying = false

    if (p < 0.15) {
      // Step 1: Move to Object (rotates base to pick station, positions claw directly above)
      const t = smooth(p / 0.15)
      baseYaw = lerp(0, pickYaw, t)
      slideY = 0.0 // retracted at top
      clawSpread = lerp(0.05, 0.18, t) // claw fingers open ready
      isCarrying = false
    } else if (p < 0.30) {
      // Step 2: Descend (vertical arm segment moves downward, bringing claw to object height)
      const t = smooth((p - 0.15) / 0.15)
      baseYaw = pickYaw
      slideY = -lerp(0, maxDescent, t) // Visibly descends!
      clawSpread = 0.18 // claw fingers open wide
      isCarrying = false
    } else if (p < 0.45) {
      // Step 3: Open & Grip (claw fingers close firmly around workpiece)
      const t = smooth((p - 0.30) / 0.15)
      baseYaw = pickYaw
      slideY = -maxDescent
      clawSpread = lerp(0.18, 0.0, t) // closes tightly around object
      isCarrying = t > 0.4
    } else if (p < 0.58) {
      // Step 4: Lift (vertical segment rises while holding object, object follows claw)
      const t = smooth((p - 0.45) / 0.13)
      baseYaw = pickYaw
      slideY = -lerp(maxDescent, 0, t) // rises back up
      clawSpread = 0.0 // clamped tight
      isCarrying = true
    } else if (p < 0.76) {
      // Step 5: Transport (arm moves held object to target position without slipping)
      const t = smooth((p - 0.58) / 0.18)
      baseYaw = lerp(pickYaw, sortYaw, t) // sweeps smoothly to sorting station
      slideY = 0.0
      clawSpread = 0.0
      isCarrying = true
    } else if (p < 0.90) {
      // Step 6: Lower & Release (claw descends to destination, releases object, lifts away)
      const t = (p - 0.76) / 0.14
      baseYaw = sortYaw
      if (t < 0.55) {
        // Descend to sorting pedestal
        const tDown = smooth(t / 0.55)
        slideY = -lerp(0, maxDescent, tDown)
        clawSpread = 0.0
        isCarrying = true
      } else {
        // Open claw to release
        slideY = -maxDescent
        const tRelease = smooth((t - 0.55) / 0.45)
        clawSpread = lerp(0.0, 0.18, tRelease)
        isCarrying = false
      }
    } else {
      // Step 7: Repeat (lifts away and returns to initial pick point)
      const t = smooth((p - 0.90) / 0.10)
      slideY = -lerp(maxDescent, 0, t)
      baseYaw = lerp(sortYaw, pickYaw, t)
      clawSpread = 0.05
      isCarrying = false
    }

    // Apply joint rotation and slide translation
    baseTurntable.rotation.y = baseYaw
    verticalSlide.position.y = slideY

    // Articulate claw fingers
    leftClaw.position.x = -0.09 - clawSpread
    leftClaw.rotation.z = clawSpread * 1.8

    rightClaw.position.x = 0.09 + clawSpread
    rightClaw.rotation.z = -clawSpread * 1.8

    // Coordinate object attachment
    if (payload) {
      if (isCarrying && gripAnchor) {
        // Object is rigidly clamped between fingers — follows claw in world space!
        gripAnchor.getWorldPosition(tempVec)
        payload.position.copy(tempVec)
      } else if (p >= 0.85) {
        // Released in sorting receptacle
        payload.position.copy(sortStationPos)
      } else {
        // Resting on pick station
        payload.position.copy(pickStationPos)
      }
    }

    // Update live telemetry
    setTelemetry({
      yaw: `${Math.round((baseYaw * 180) / Math.PI)}°`,
      shoulder: '47°',
      elbow: '37°',
      slide: `${Math.round(Math.abs(slideY) * 100)} mm`,
      claw: clawSpread < 0.04 ? 'Clamped (18°)' : 'Open (70°)'
    })

    // Update active stage indicator
    let currIdx = 0
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (p >= STAGES[i].time - 0.02) {
        currIdx = i
        break
      }
    }
    setActiveStageIndex(currIdx)
  }

  // Controls: Pause / Resume
  const togglePlay = () => {
    const next = !isPlaying
    setIsPlaying(next)
    isPlayingRef.current = next
  }

  // Scrub timeline
  const handleScrub = (e) => {
    const val = parseFloat(e.target.value)
    setProgress(val)
    if (isPlaying) {
      setIsPlaying(false)
      isPlayingRef.current = false
    }
  }

  // Jump to specific step
  const jumpToStage = (idx) => {
    setProgress(STAGES[idx].time)
    if (isPlaying) {
      setIsPlaying(false)
      isPlayingRef.current = false
    }
  }

  // Reset 3D Camera without altering playback state
  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
      controlsRef.current.target.set(0, 1.25, 0.3)
    }
  }

  const currentStage = STAGES[activeStageIndex]

  return (
    <div className="papr-3d-wrapper">
      {/* Control Ribbon */}
      <div className="papr-control-ribbon">
        <div className="papr-title-group">
          <div className="papr-badge">RKI 1–4 Kinematics</div>
          <h4>Pick & Place Robotic Arm (PAPR)</h4>
        </div>
        <div className="papr-actions">
          <button
            type="button"
            className={`papr-pill-btn ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => setViewMode('3d')}
            title="Interactive 3-D WebGL Simulation"
          >
            <span>◈</span> 3D WebGL
          </button>
          <button
            type="button"
            className={`papr-pill-btn ${viewMode === 'cad-overlay' ? 'active' : ''}`}
            onClick={() => setViewMode('cad-overlay')}
            title="View Genuine CAD Blueprint from Documentation"
          >
            <span>📐</span> CAD Model
          </button>
          <button
            type="button"
            className={`papr-pill-btn play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
          >
            {isPlaying ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button
            type="button"
            className="papr-pill-btn"
            onClick={handleResetCamera}
            title="Reset 3D Camera View"
          >
            ↺ Reset View
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="papr-viewport-container">
        {/* 3D WebGL Canvas */}
        <div
          ref={mountRef}
          className="papr-canvas-mount"
          style={{ display: viewMode === '3d' ? 'block' : 'none' }}
        />

        {/* CAD Blueprint Comparison View */}
        {viewMode === 'cad-overlay' && (
          <div className="papr-cad-view">
            <div className="papr-cad-card">
              <div className="papr-cad-tag">Visual Representation of the Robotic Arm (PDF Fig 1 & Fig 10)</div>
              <img
                src="/assets/components/papr_cad_robot.jpg"
                alt="PAPR CAD Mechanical System from PDF"
                className="papr-cad-image"
              />
              <div className="papr-cad-caption">
                <p>
                  <strong>Documented Construction:</strong> Two wooden plates (300 mm × 300 mm × 10 mm),
                  26 mm × 26 mm aluminium channels, 2 mm and 4 mm metal sheets, MG996R servo motors (RKI 1 Base, RKI 2 Shoulder, RKI 3 Elbow),
                  MG90S servo motor (RKI 4 Wrist and pincer claw).
                </p>
                <button
                  type="button"
                  className="button"
                  onClick={() => setViewMode('3d')}
                  style={{ marginTop: 12, padding: '9px 18px', fontSize: '0.78rem' }}
                >
                  Return to 3D Simulation <span>↖</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Overlays */}
        <div className="papr-canvas-overlay">
          {/* HUD Status Card */}
          <div className="papr-hud-card">
            <div className="papr-hud-header">
              <span className={`papr-pulse-indicator ${isPlaying ? '' : 'paused'}`}></span>
              <span className="papr-hud-stage">{currentStage.label}</span>
            </div>
            <h5 className="papr-hud-title">{currentStage.heading}</h5>
            <p className="papr-hud-desc">{currentStage.desc}</p>

            <div className="papr-hud-specs">
              <div className="papr-spec-item">
                <span className="papr-spec-key">RKI 1 (BASE)</span>
                <span className="papr-spec-val">{telemetry.yaw}</span>
              </div>
              <div className="papr-spec-item">
                <span className="papr-spec-key">Vertical Descent</span>
                <span className="papr-spec-val">{telemetry.slide}</span>
              </div>
              <div className="papr-spec-item">
                <span className="papr-spec-key">RKI 2 & 3 (ARM)</span>
                <span className="papr-spec-val">θ₁: {telemetry.shoulder} | θ₂: {telemetry.elbow}</span>
              </div>
              <div className="papr-spec-item">
                <span className="papr-spec-key">Gripper (MG90S)</span>
                <span className="papr-spec-val">{telemetry.claw}</span>
              </div>
            </div>
          </div>

          {/* Component Callout Badges */}
          <div className="papr-components-filter">
            <span className="filter-label">Verified PDF Specs:</span>
            <span className="filter-tag">300×300×10mm Base</span>
            <span className="filter-tag">26×26mm Channels</span>
            <span className="filter-tag">MG996R (RKI 1–3)</span>
            <span className="filter-tag highlight-blue">MG90S (RKI 4 & Claw)</span>
            <span className="filter-tag highlight-cyan">Cyan Link Guide</span>
          </div>

          {/* Interaction Hint */}
          <div className="papr-hint">
            <span>🖱 Drag to rotate 360° • Pinch/wheel to zoom • Pause/Resume controls playback</span>
          </div>
        </div>
      </div>

      {/* Scrubber & Timeline Navigation Bar */}
      <div className="papr-scrubber-bar">
        <div className="papr-scrub-row">
          <span className="scrub-label">Pick & Place Sequence Timeline</span>
          <span className="scrub-percent">{Math.round(progress * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.005"
          value={progress}
          onChange={handleScrub}
          className="papr-range-slider"
          aria-label="Kinematic animation timeline scrubber"
        />

        {/* 7 Phase Buttons */}
        <div className="papr-stage-buttons">
          {STAGES.map((stg, i) => (
            <button
              key={stg.id}
              type="button"
              className={`papr-stage-btn ${activeStageIndex === i ? 'active' : ''}`}
              onClick={() => jumpToStage(i)}
            >
              <span className="stg-dot"></span>
              <span className="stg-name">{stg.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
