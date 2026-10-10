import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Operational phases of the Pick and Place sequence
export const STAGES = [
  {
    id: 'standby',
    label: '01. Calibrated Standby',
    time: 0.0,
    heading: 'Kinematic Ready Posture',
    desc: 'The PAPR arm maintains home ready posture above the dual-tier workbench. MG996R and MG90S servo motors are energized and holding torque at calibrated neutral offsets.',
    specs: { 'Base Yaw': '0° (Center)', 'Shoulder': '28°', 'Elbow': '-38°', 'Gripper': 'Neutral Ready' }
  },
  {
    id: 'reach',
    label: '02. Kinematic Reach',
    time: 0.22,
    heading: 'Target Acquisition & Extension',
    desc: 'Base turntable sweeps -45° towards Pick Station A. Shoulder and elbow links articulate forward and down, extending the gripper directly over the target workpiece.',
    specs: { 'Base Yaw': '-45° (Pick)', 'Shoulder': '64°', 'Elbow': '-85°', 'Gripper': 'Open (MG90S 65°)' }
  },
  {
    id: 'grasp',
    label: '03. Precision Claw Grasp',
    time: 0.40,
    heading: 'Claw Gripper Actuation',
    desc: 'The MG90S micro-servo drives the parallel claw linkage closed. High-friction jaw pads clamp firmly onto the workpiece with verified contact force.',
    specs: { 'Grip Force': '12.4 N', 'MG90S Angle': 'Closed (18°)', 'Jaws': 'Clamped 100%', 'Payload': 'Secured' }
  },
  {
    id: 'lift',
    label: '04. High-Torque Vertical Lift',
    time: 0.60,
    heading: 'Vertical Lift & Clearance Arc',
    desc: 'Twin MG996R metal-gear servos deliver peak driving torque to lift the lower arm, forearm, and gripped workpiece vertically clear of the pick fixture.',
    specs: { 'Lift Height': '+160 mm', 'Driving Torque': '9.8 kg·cm', 'Shoulder': '22°', 'Elbow': '-32°' }
  },
  {
    id: 'transfer',
    label: '05. Workspace Transfer',
    time: 0.80,
    heading: 'Spatial Transfer to Sorting Point',
    desc: 'Base yaw sweeps across the working envelope from -45° to +45° towards the sorting receptacle. Wrist pitch compensates continuously to maintain payload stability.',
    specs: { 'Base Yaw': '+45° (Sort)', 'Path': '3D Arc Trajectory', 'Payload': 'Clamped', 'Clearance': 'High Margin' }
  },
  {
    id: 'release',
    label: '06. Sort & Release',
    time: 1.0,
    heading: 'Placement & Sorting Complete',
    desc: 'The arm lowers over sorting receptacle B. The MG90S servo opens the claw jaws to release the workpiece into the sorted bin, and the arm preps the next cycle.',
    specs: { 'Target': 'Sorting Bin B', 'MG90S Angle': 'Open (70°)', 'Status': 'Sorted 100%', 'Next Cycle': 'Armed' }
  }
]

export default function PaprRobot3D({ theme = 'light', externalScrollProgress = null }) {
  const mountRef = useRef(null)
  const controlsRef = useRef(null)
  const animFrameRef = useRef(null)
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(false)
  const [viewMode, setViewMode] = useState('3d') // '3d' | 'cad-overlay'
  const [liveAngles, setLiveAngles] = useState({ yaw: '0°', shoulder: '28°', elbow: '-38°', claw: 'Ready' })

  // Kinematic joints refs
  const kinematicRefs = useRef({
    baseTurntable: null,
    shoulderJoint: null,
    elbowJoint: null,
    wristJoint: null,
    leftClaw: null,
    rightClaw: null,
    gripAnchor: null,
    payload: null,
    pickStationPos: new THREE.Vector3(-1.25, 1.15, 1.25),
    sortStationPos: new THREE.Vector3(1.25, 1.15, 1.25),
    highlightMeshes: {}
  })

  const progressRef = useRef(0)
  progressRef.current = progress

  // Keep isPlayingRef in sync with state
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  // Handle external scroll progress from page scrolling
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

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    camera.position.set(3.8, 3.2, 4.4)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 - 0.05
    controls.minDistance = 2.0
    controls.maxDistance = 9.0
    controls.target.set(0, 1.25, 0.3)
    controlsRef.current = controls

    // Lighting
    const ambientLight = new THREE.AmbientLight(theme === 'dark' ? 0x223a4e : 0xd8e6ef, 1.5)
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

    // Materials
    const metalAlumMat = new THREE.MeshStandardMaterial({
      color: 0xc4ced6,
      metalness: 0.85,
      roughness: 0.28,
      name: 'metal'
    })
    const darkBracketMat = new THREE.MeshStandardMaterial({
      color: 0x1a2026,
      metalness: 0.65,
      roughness: 0.45,
      name: 'brackets'
    })
    const servoMg996Mat = new THREE.MeshStandardMaterial({
      color: 0x11161b,
      metalness: 0.45,
      roughness: 0.4,
      name: 'mg996r'
    })
    const servoMg90sMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Classic MG90S semi-translucent blue servo casing
      metalness: 0.3,
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

    // ----------------------------------------------------
    // BUILD WORKBENCH & ROBOT AS PER USER CAD MODEL
    // ----------------------------------------------------
    const robotRoot = new THREE.Group()
    scene.add(robotRoot)

    // 1. Dual-tier Workbench Base Table
    const tableGroup = new THREE.Group()
    robotRoot.add(tableGroup)

    // Top table plate
    const topPlateGeo = new THREE.BoxGeometry(3.6, 0.1, 3.6)
    const topPlate = new THREE.Mesh(topPlateGeo, metalAlumMat)
    topPlate.position.y = 0.95
    topPlate.receiveShadow = true
    topPlate.castShadow = true
    tableGroup.add(topPlate)

    // Bottom shelf plate
    const bottomPlateGeo = new THREE.BoxGeometry(3.6, 0.08, 3.6)
    const bottomPlate = new THREE.Mesh(bottomPlateGeo, metalAlumMat)
    bottomPlate.position.y = 0.2
    bottomPlate.receiveShadow = true
    bottomPlate.castShadow = true
    tableGroup.add(bottomPlate)

    // 4 Corner vertical legs
    const legGeo = new THREE.BoxGeometry(0.24, 0.95, 0.24)
    const legPositions = [
      [-1.65, 0.5, -1.65],
      [1.65, 0.5, -1.65],
      [-1.65, 0.5, 1.65],
      [1.65, 0.5, 1.65]
    ]
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, metalAlumMat)
      leg.position.set(...pos)
      leg.castShadow = true
      leg.receiveShadow = true
      tableGroup.add(leg)
    })

    // Corner bracket reinforcements with bolts
    const bracketGeo = new THREE.BoxGeometry(0.3, 0.25, 0.05)
    const boltGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.06, 8)
    const boltMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.2 })

    legPositions.forEach(pos => {
      const cornerBracket = new THREE.Mesh(bracketGeo, darkBracketMat)
      cornerBracket.position.set(pos[0], 0.88, pos[2] > 0 ? pos[2] + 0.12 : pos[2] - 0.12)
      tableGroup.add(cornerBracket)

      const bolt = new THREE.Mesh(boltGeo, boltMat)
      bolt.rotation.x = Math.PI / 2
      bolt.position.set(pos[0], 0.88, pos[2] > 0 ? pos[2] + 0.15 : pos[2] - 0.15)
      tableGroup.add(bolt)
    })

    // Stations
    // Pick station: exactly at (-1.25, 1.03, 1.25) -> radius 1.768, angle -45°
    const pickStationGeo = new THREE.CylinderGeometry(0.42, 0.45, 0.08, 32)
    const pickStationMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 })
    const pickStation = new THREE.Mesh(pickStationGeo, pickStationMat)
    pickStation.position.set(-1.25, 1.04, 1.25)
    pickStation.receiveShadow = true
    tableGroup.add(pickStation)

    const pickRingGeo = new THREE.RingGeometry(0.24, 0.35, 32)
    const pickRingMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide })
    const pickRing = new THREE.Mesh(pickRingGeo, pickRingMat)
    pickRing.rotation.x = -Math.PI / 2
    pickRing.position.set(-1.25, 1.085, 1.25)
    tableGroup.add(pickRing)

    // Sort station: exactly at (+1.25, 1.03, 1.25) -> radius 1.768, angle +45°
    const sortStationGeo = new THREE.CylinderGeometry(0.45, 0.48, 0.12, 32)
    const sortStationMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.35, metalness: 0.6 })
    const sortStation = new THREE.Mesh(sortStationGeo, sortStationMat)
    sortStation.position.set(1.25, 1.06, 1.25)
    sortStation.receiveShadow = true
    tableGroup.add(sortStation)

    const sortRingGeo = new THREE.RingGeometry(0.28, 0.38, 32)
    const sortRingMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
    const sortRing = new THREE.Mesh(sortRingGeo, sortRingMat)
    sortRing.rotation.x = -Math.PI / 2
    sortRing.position.set(1.25, 1.125, 1.25)
    tableGroup.add(sortRing)

    // Target Payload Object
    const payloadGroup = new THREE.Group()
    const payloadGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22)
    const payloadMesh = new THREE.Mesh(payloadGeo, payloadMat)
    payloadMesh.castShadow = true
    payloadMesh.receiveShadow = true
    payloadGroup.add(payloadMesh)
    payloadGroup.position.set(-1.25, 1.15, 1.25)
    scene.add(payloadGroup)

    // 2. ROBOTIC ARM ASSEMBLY (KINEMATIC HIERARCHY)
    // Table Base Mount Plate
    const baseMountPlateGeo = new THREE.BoxGeometry(0.72, 0.06, 0.72)
    const baseMountPlate = new THREE.Mesh(baseMountPlateGeo, metalAlumMat)
    baseMountPlate.position.set(0, 1.03, 0)
    baseMountPlate.castShadow = true
    tableGroup.add(baseMountPlate)

    // Base Turntable Group (Rotates around Y axis: Yaw)
    const baseTurntable = new THREE.Group()
    baseTurntable.position.set(0, 1.06, 0)
    robotRoot.add(baseTurntable)

    // Base bracket housing MG996R servo
    const baseBracket = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.42), darkBracketMat)
    baseBracket.position.set(0, 0.16, 0)
    baseBracket.castShadow = true
    baseTurntable.add(baseBracket)

    const baseServoBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.22), servoMg996Mat)
    baseServoBody.position.set(0, 0.14, 0)
    baseTurntable.add(baseServoBody)

    const baseHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), brassGearMat)
    baseHorn.position.set(0, 0.32, 0)
    baseTurntable.add(baseHorn)

    // Upright U-bracket fork holding shoulder joint
    const forkLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.46, 0.26), darkBracketMat)
    forkLeft.position.set(-0.16, 0.52, 0)
    forkLeft.castShadow = true
    baseTurntable.add(forkLeft)

    const forkRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.46, 0.26), darkBracketMat)
    forkRight.position.set(0.16, 0.52, 0)
    forkRight.castShadow = true
    baseTurntable.add(forkRight)

    // MG996R Shoulder Servo housing
    const shoulderServoBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.38, 0.22), servoMg996Mat)
    shoulderServoBody.position.set(0.24, 0.54, 0)
    shoulderServoBody.castShadow = true
    baseTurntable.add(shoulderServoBody)

    // Shoulder Joint (Rotates around X axis: Pitch 1)
    const shoulderJoint = new THREE.Group()
    shoulderJoint.position.set(0, 0.58, 0)
    baseTurntable.add(shoulderJoint)

    const shoulderPin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.38, 16), brassGearMat)
    shoulderPin.rotation.z = Math.PI / 2
    shoulderJoint.add(shoulderPin)

    // Lower Arm Link (Extruded aluminum channel, length = 1.25)
    const lowerArmGroup = new THREE.Group()
    shoulderJoint.add(lowerArmGroup)

    const lowerArmChannel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.25, 0.14), metalAlumMat)
    lowerArmChannel.position.set(0, 0.625, 0)
    lowerArmChannel.castShadow = true
    lowerArmGroup.add(lowerArmChannel)

    // Reinforcement bracket plates on lower arm
    const sidePlateGeo = new THREE.BoxGeometry(0.2, 0.32, 0.16)
    const sidePlateBottom = new THREE.Mesh(sidePlateGeo, darkBracketMat)
    sidePlateBottom.position.set(0, 0.2, 0)
    lowerArmGroup.add(sidePlateBottom)

    const sidePlateTop = new THREE.Mesh(sidePlateGeo, darkBracketMat)
    sidePlateTop.position.set(0, 1.05, 0)
    lowerArmGroup.add(sidePlateTop)

    // Elbow Joint (Pivot at top of lower arm, rotates around X axis: Pitch 2)
    const elbowJoint = new THREE.Group()
    elbowJoint.position.set(0, 1.25, 0)
    lowerArmGroup.add(elbowJoint)

    const elbowBracket = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.24), darkBracketMat)
    elbowBracket.position.set(0, 0.04, 0)
    elbowBracket.castShadow = true
    elbowJoint.add(elbowBracket)

    const elbowServo = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 0.2), servoMg996Mat)
    elbowServo.position.set(-0.16, 0.06, 0)
    elbowServo.castShadow = true
    elbowJoint.add(elbowServo)

    // Glowing Cyan Link Guide (as in user's CAD image)
    const cyanLinkMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.58, 24), cyanGlowMat)
    cyanLinkMesh.rotation.x = Math.PI / 2
    cyanLinkMesh.position.set(0.12, 0.06, 0.26)
    cyanLinkMesh.castShadow = true
    elbowJoint.add(cyanLinkMesh)

    // Forearm Section (Extruded aluminum channel, length = 1.1)
    const forearmGroup = new THREE.Group()
    elbowJoint.add(forearmGroup)

    const forearmChannel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 0.12), metalAlumMat)
    forearmChannel.position.set(0, 0.55, 0)
    forearmChannel.castShadow = true
    forearmGroup.add(forearmChannel)

    const forearmTopClamp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.14), darkBracketMat)
    forearmTopClamp.position.set(0, 0.95, 0)
    forearmGroup.add(forearmTopClamp)

    // Wrist Joint (Rotates around X axis: Pitch 3, driven by MG90S)
    const wristJoint = new THREE.Group()
    wristJoint.position.set(0, 1.1, 0)
    forearmGroup.add(wristJoint)

    // MG90S Micro Servo body
    const mg90sBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.12), servoMg90sMat)
    mg90sBody.position.set(0, 0.08, 0.06)
    mg90sBody.castShadow = true
    wristJoint.add(mg90sBody)

    const mg90sHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12), brassGearMat)
    mg90sHorn.rotation.z = Math.PI / 2
    mg90sHorn.position.set(0.08, 0.14, 0.06)
    wristJoint.add(mg90sHorn)

    // Gripper Base Group (Claw Mechanism)
    const gripperBaseGroup = new THREE.Group()
    gripperBaseGroup.position.set(0, 0.22, 0)
    wristJoint.add(gripperBaseGroup)

    const gripperBackplate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.2), darkBracketMat)
    gripperBackplate.position.set(0, 0.03, 0)
    gripperBaseGroup.add(gripperBackplate)

    // Left Claw Finger
    const leftClaw = new THREE.Group()
    leftClaw.position.set(-0.09, 0.06, 0)
    gripperBaseGroup.add(leftClaw)

    const fingerGeo = new THREE.BoxGeometry(0.05, 0.36, 0.07)
    const leftFinger1 = new THREE.Mesh(fingerGeo, darkBracketMat)
    leftFinger1.position.set(-0.04, 0.18, 0)
    leftFinger1.rotation.z = -0.25
    leftFinger1.castShadow = true
    leftClaw.add(leftFinger1)

    const tipGeo = new THREE.BoxGeometry(0.04, 0.16, 0.06)
    const leftTip = new THREE.Mesh(tipGeo, clawRubberMat)
    leftTip.position.set(0.03, 0.35, 0)
    leftTip.rotation.z = 0.4
    leftClaw.add(leftTip)

    // Right Claw Finger
    const rightClaw = new THREE.Group()
    rightClaw.position.set(0.09, 0.06, 0)
    gripperBaseGroup.add(rightClaw)

    const rightFinger1 = new THREE.Mesh(fingerGeo, darkBracketMat)
    rightFinger1.position.set(0.04, 0.18, 0)
    rightFinger1.rotation.z = 0.25
    rightFinger1.castShadow = true
    rightClaw.add(rightFinger1)

    const rightTip = new THREE.Mesh(tipGeo, clawRubberMat)
    rightTip.position.set(-0.03, 0.35, 0)
    rightTip.rotation.z = -0.4
    rightClaw.add(rightTip)

    // Grip Anchor (Exact 3D point between the two claw fingertips)
    const gripAnchor = new THREE.Group()
    gripAnchor.position.set(0, 0.38, 0)
    gripperBaseGroup.add(gripAnchor)

    // Store refs
    kinematicRefs.current = {
      baseTurntable,
      shoulderJoint,
      elbowJoint,
      wristJoint,
      leftClaw,
      rightClaw,
      gripAnchor,
      payload: payloadGroup,
      pickStationPos: new THREE.Vector3(-1.25, 1.15, 1.25),
      sortStationPos: new THREE.Vector3(1.25, 1.15, 1.25)
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

      // Automatic playback
      if (isPlayingRef.current) {
        setProgress(p => {
          let next = p + delta * 0.14
          if (next >= 1.0) next = 0.0
          return next
        })
      }

      // Live kinematic calculation
      applyKinematics(progressRef.current, tempVec)

      // Pulsing glow on cyan CAD link
      cyanGlowMat.emissiveIntensity = 1.4 + Math.sin(time * 0.005) * 0.6

      controls.update()
      renderer.render(scene, camera)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    // Resize
    const onResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
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

  // Complete Forward Kinematics & Payload Locking
  const applyKinematics = (p, tempVec = new THREE.Vector3()) => {
    const {
      baseTurntable,
      shoulderJoint,
      elbowJoint,
      wristJoint,
      leftClaw,
      rightClaw,
      gripAnchor,
      payload,
      pickStationPos,
      sortStationPos
    } = kinematicRefs.current

    if (!baseTurntable || !shoulderJoint || !elbowJoint || !wristJoint || !leftClaw || !rightClaw) return

    const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t))
    const smooth = (t) => {
      const c = Math.max(0, Math.min(1, t))
      return c * c * (3 - 2 * c)
    }

    let baseYaw = 0
    let shoulderPitch = 0.48   // Standby: ~28°
    let elbowPitch = -0.66     // Standby: ~-38°
    let wristPitch = 0.18      // Standby wrist
    let clawSpread = 0.05      // 0.0 = tight clamp, 0.16 = open
    let isGrippingPayload = false

    // Target pick and sort angles
    const pickYaw = -0.785     // -45° towards Pick Station
    const sortYaw = 0.785      // +45° towards Sorting Station
    const reachShoulder = 1.12 // 64° forward extension
    const reachElbow = -1.48   // -85° reach down towards table
    const reachWrist = 0.36    // level claw facing downwards

    const liftShoulder = 0.38  // 22° vertical lift
    const liftElbow = -0.56    // -32° high clearance
    const liftWrist = 0.18

    if (p < 0.22) {
      // Phase 1: Standby (0.0) -> Reach to pick station (0.22)
      const t = smooth(p / 0.22)
      baseYaw = lerp(0, pickYaw, t)
      shoulderPitch = lerp(0.48, reachShoulder, t)
      elbowPitch = lerp(-0.66, reachElbow, t)
      wristPitch = lerp(0.18, reachWrist, t)
      clawSpread = lerp(0.05, 0.16, t) // Open claw wide to prepare for grasp
      isGrippingPayload = false
    } else if (p < 0.40) {
      // Phase 2: At Pick Station -> Close Claw around Payload (0.22 -> 0.40)
      const t = smooth((p - 0.22) / 0.18)
      baseYaw = pickYaw
      shoulderPitch = reachShoulder
      elbowPitch = reachElbow
      wristPitch = reachWrist
      clawSpread = lerp(0.16, 0.0, t) // Close jaws tightly
      isGrippingPayload = t > 0.4 // Payload becomes attached to claw
    } else if (p < 0.60) {
      // Phase 3: High-Torque Lift from table (0.40 -> 0.60)
      const t = smooth((p - 0.40) / 0.20)
      baseYaw = pickYaw
      shoulderPitch = lerp(reachShoulder, liftShoulder, t) // Arm bends back & lifts up!
      elbowPitch = lerp(reachElbow, liftElbow, t)         // Elbow pulls payload upwards!
      wristPitch = lerp(reachWrist, liftWrist, t)
      clawSpread = 0.0 // Clamped tight
      isGrippingPayload = true
    } else if (p < 0.80) {
      // Phase 4: Spatial 3D Transfer across workspace (0.60 -> 0.80)
      const t = smooth((p - 0.60) / 0.20)
      baseYaw = lerp(pickYaw, sortYaw, t) // Sweeps across table from -45° to +45°!
      // Add slight vertical arc dynamics
      const arc = Math.sin(t * Math.PI) * 0.12
      shoulderPitch = liftShoulder - arc * 0.5
      elbowPitch = liftElbow + arc * 0.5
      wristPitch = liftWrist
      clawSpread = 0.0 // Clamped tight
      isGrippingPayload = true
    } else if (p < 0.92) {
      // Phase 5: Lower arm over Sorting Station & Release (0.80 -> 0.92)
      const t = smooth((p - 0.80) / 0.12)
      baseYaw = sortYaw
      shoulderPitch = lerp(liftShoulder, reachShoulder, t) // Lowers down to bin!
      elbowPitch = lerp(liftElbow, reachElbow, t)
      wristPitch = lerp(liftWrist, reachWrist, t)

      // Near bottom of stroke, claw opens
      if (t > 0.65) {
        const tOpen = (t - 0.65) / 0.35
        clawSpread = lerp(0.0, 0.16, tOpen)
        isGrippingPayload = false
      } else {
        clawSpread = 0.0
        isGrippingPayload = true
      }
    } else {
      // Phase 6: Retract & Return to Standby (0.92 -> 1.0)
      const t = smooth((p - 0.92) / 0.08)
      baseYaw = lerp(sortYaw, 0, t)
      shoulderPitch = lerp(reachShoulder, 0.48, t)
      elbowPitch = lerp(reachElbow, -0.66, t)
      wristPitch = lerp(reachWrist, 0.18, t)
      clawSpread = 0.08
      isGrippingPayload = false
    }

    // Apply rotations directly to joints
    baseTurntable.rotation.y = baseYaw
    shoulderJoint.rotation.x = shoulderPitch
    elbowJoint.rotation.x = elbowPitch
    wristJoint.rotation.x = wristPitch

    // Symmetrical claw jaw articulation
    leftClaw.position.x = -0.09 - clawSpread
    leftClaw.rotation.z = -clawSpread * 2.0

    rightClaw.position.x = 0.09 + clawSpread
    rightClaw.rotation.z = clawSpread * 2.0

    // Synchronize payload position
    if (payload) {
      if (isGrippingPayload && gripAnchor) {
        // Physical lock: workpiece is rigidly clamped between claw pads!
        gripAnchor.getWorldPosition(tempVec)
        payload.position.copy(tempVec)
      } else if (p >= 0.88) {
        // Released at sorting bin
        payload.position.copy(sortStationPos)
      } else {
        // At pick station
        payload.position.copy(pickStationPos)
      }
    }

    // Update live angle telemetry
    setLiveAngles({
      yaw: `${Math.round((baseYaw * 180) / Math.PI)}°`,
      shoulder: `${Math.round((shoulderPitch * 180) / Math.PI)}°`,
      elbow: `${Math.round((elbowPitch * 180) / Math.PI)}°`,
      claw: clawSpread < 0.03 ? 'Clamped (Grip)' : 'Open (Release)'
    })

    // Active stage index
    let currIdx = 0
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (p >= STAGES[i].time - 0.02) {
        currIdx = i
        break
      }
    }
    setActiveStageIndex(currIdx)
  }

  // Toggle Play / Pause cycle
  const togglePlay = () => {
    const next = !isPlaying
    setIsPlaying(next)
    isPlayingRef.current = next
  }

  // Slider scrub
  const handleScrub = (e) => {
    const val = parseFloat(e.target.value)
    setProgress(val)
    if (isPlaying) {
      setIsPlaying(false)
      isPlayingRef.current = false
    }
  }

  // Jump to specific stage
  const jumpToStage = (idx) => {
    setProgress(STAGES[idx].time)
    if (isPlaying) {
      setIsPlaying(false)
      isPlayingRef.current = false
    }
  }

  // Reset 3D Camera view
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
          <div className="papr-badge">4-DOF + 1 Gripper</div>
          <h4>Pick & Place Robotic Arm Kinematic Engine</h4>
        </div>
        <div className="papr-actions">
          <button
            type="button"
            className={`papr-pill-btn ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => setViewMode('3d')}
            title="Interactive 3-D WebGL Simulation"
          >
            <span>◈</span> 3-D WebGL
          </button>
          <button
            type="button"
            className={`papr-pill-btn ${viewMode === 'cad-overlay' ? 'active' : ''}`}
            onClick={() => setViewMode('cad-overlay')}
            title="View Original CAD Model Render"
          >
            <span>📐</span> CAD Model
          </button>
          <button
            type="button"
            className={`papr-pill-btn play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
          >
            {isPlaying ? '⏸ Pause Cycle' : '▶ Play Cycle'}
          </button>
          <button
            type="button"
            className="papr-pill-btn"
            onClick={handleResetCamera}
            title="Reset 3D Camera Angle"
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
              <div className="papr-cad-tag">Original CAD Assembly Blueprint</div>
              <img
                src="/assets/papr-cad-render.png"
                alt="PAPR CAD Mechanical System"
                className="papr-cad-image"
              />
              <div className="papr-cad-caption">
                <p>
                  <strong>Physical Kinematics:</strong> Structural aluminum chassis with dual-tier workbench,
                  base swivel turntable, twin MG996R high-torque shoulder/elbow servos, cyan guide link,
                  MG90S micro-servo wrist drive, and parallel linkage claw gripper.
                </p>
                <button
                  type="button"
                  className="button"
                  onClick={() => setViewMode('3d')}
                  style={{ marginTop: 12, padding: '9px 18px', fontSize: '0.78rem' }}
                >
                  Return to 3-D Kinematic Animation <span>↖</span>
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
              <span className="papr-pulse-indicator"></span>
              <span className="papr-hud-stage">{currentStage.label}</span>
            </div>
            <h5 className="papr-hud-title">{currentStage.heading}</h5>
            <p className="papr-hud-desc">{currentStage.desc}</p>

            <div className="papr-hud-specs">
              <div className="papr-spec-item">
                <span className="papr-spec-key">Base Turntable</span>
                <span className="papr-spec-val">{liveAngles.yaw}</span>
              </div>
              <div className="papr-spec-item">
                <span className="papr-spec-key">Shoulder Pitch</span>
                <span className="papr-spec-val">{liveAngles.shoulder}</span>
              </div>
              <div className="papr-spec-item">
                <span className="papr-spec-key">Elbow Pitch</span>
                <span className="papr-spec-val">{liveAngles.elbow}</span>
              </div>
              <div className="papr-spec-item">
                <span className="papr-spec-key">Claw Jaws (MG90S)</span>
                <span className="papr-spec-val">{liveAngles.claw}</span>
              </div>
            </div>
          </div>

          {/* Component Callout Badges */}
          <div className="papr-components-filter">
            <span className="filter-label">Mechanical Highlights:</span>
            <span className="filter-tag">Dual-Tier Base</span>
            <span className="filter-tag">MG996R Servos (High Torque)</span>
            <span className="filter-tag">Extruded Links</span>
            <span className="filter-tag highlight-cyan">Cyan Link Guide</span>
            <span className="filter-tag highlight-blue">MG90S Servo</span>
            <span className="filter-tag">Claw Gripper</span>
          </div>

          {/* Interaction Hint */}
          <div className="papr-hint">
            <span>🖱 Drag to rotate 360° • Scroll/Pinch to zoom • Drag slider or click Play to animate</span>
          </div>
        </div>
      </div>

      {/* Scrubber & Timeline Navigation Bar */}
      <div className="papr-scrubber-bar">
        <div className="papr-scrub-row">
          <span className="scrub-label">Pick & Place Kinematic Timeline</span>
          <span className="scrub-percent">{Math.round(progress * 100)}% Complete</span>
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

        {/* Phase Buttons */}
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
