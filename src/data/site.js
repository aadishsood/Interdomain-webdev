import { objectPosition } from "three/tsl"

export const TEAM_MEMBERS = [
  { memberNumber: 1, name: 'Abhinav K Anand', domain: 'SAMBED', instagram: 'https://www.instagram.com/abhi_tboat', linkedin: 'https://in.linkedin.com/in/abhinav-k-anand-bb277937a', image: '/assets/team/member-1.png', objectPosition: 'center 32%' },
  { memberNumber: 2, name: 'Prarthana M', domain: 'SAMBED', instagram: 'https://www.instagram.com/prarthzzz_._?stkn=NGNvOWp0ZnY2N2Jn', linkedin: 'https://www.linkedin.com/in/prarthana-m-7a45ab3a0', image: '/assets/team/member-2.png',objectPosition:'center 18%' },
  { memberNumber: 3, name: 'Aadish Sood', domain: 'SPACED (WebDev)', instagram: 'https://www.instagram.com/sood_aadi008', linkedin: 'https://www.linkedin.com/in/aadish-sood-752265435', image: '/assets/team/member-3.png' },
  { memberNumber: 4, name: 'Sairav Kharga', domain: 'SPACED (Coding)', instagram: 'https://www.instagram.com/skhrg__', linkedin: 'https://www.linkedin.com/in/sairav-kharga-9a7aa7428', image: '/assets/team/member-4.png', objectPosition: 'center 33%' },
  { memberNumber: 5, name: 'Debangshu Banik', domain: 'SPACED (Coding)', instagram: 'https://www.instagram.com/debangshu_banik/', linkedin: 'https://www.linkedin.com/in/debangshu-banik-784603280', image: '/assets/team/member-5.png' },
  { memberNumber: 6, name: 'Devi Jahnavi', domain: 'SIESED', instagram: 'https://www.instagram.com/jahnavi._.9', linkedin: 'https://www.linkedin.com/in/devi-jahnavi-914580426', image: '/assets/team/member-6.jpeg' },
  { memberNumber: 7, name: 'Mathew', domain: 'SIESED', instagram: 'https://www.instagram.com/john_mathew_1707_', linkedin: '', image: '/assets/team/member-7.jpeg', objectPosition: 'center 66%' },
  { memberNumber: 8, name: 'Parambrota Joarder', domain: 'MCSOCD (VFX/GFX)', instagram: 'https://www.instagram.com/poruneedschickfileh', linkedin: 'https://www.linkedin.com/in/parambrota-joarder-589622380', image: '/assets/team/member-8.png', objectPosition: 'center 40%' },
  { memberNumber: 9, name: 'Aadithya Mohandas', domain: 'MCSOCD (Corporate)', instagram: 'https://www.instagram.com/aadifr_', linkedin: 'https://www.linkedin.com/in/aadithya-mohandas-547605418', image: '/assets/team/member-9.png', objectPosition: 'center 14%' }
]

export const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#model', label: '3-D model' },
  { href: '#components', label: 'Components' },
  { href: '#solution', label: 'Problem & solution' },
  { href: '#team', label: 'Team' },
  { href: '#gallery', label: 'Gallery' }
]

// Authentic components extracted directly from "PAPR technical documentation.pdf"
export const COMPONENTS = [
  {
    id: 'esp32',
    title: 'ESP32 DevKit V1',
    category: 'Electronics Division',
    spec: 'Main Controller',
    desc: 'Executes control commands, processes computer vision coordinate inputs, and outputs PWM control signals to arm actuators and gripper servo.',
    image: '/assets/components/esp32_devkit_v1.png'
  },
  {
    id: 'servos',
    title: 'MG996R & MG90S Servos',
    category: 'Actuator Division',
    spec: 'RKI 1–3: MG996R | RKI 4 & Claw: MG90S',
    desc: 'High-torque metal-gear MG996R servos provide driving torque for Base (RKI 1), Shoulder (RKI 2), and Elbow (RKI 3). Compact MG90S drives Wrist (RKI 4) and pincer claw.',
    image: '/assets/components/servo_motor.png'
  },
  {
    id: 'battery',
    title: '3S Battery Pack',
    category: 'Power Division',
    spec: '11.1V Nominal DC Supply',
    desc: 'Provides main DC power source to the controller, regulated power rails, and actuator drive circuits through a dedicated protection network.',
    image: '/assets/components/battery_3s.jpg'
  },
  {
    id: 'buck',
    title: 'Buck Converters',
    category: 'Voltage Regulation',
    spec: 'LM2596 Step-Down Modules',
    desc: 'Step down main battery DC voltage to steady, regulated logic and actuator levels for the ESP32, gripper actuator, and high-current servo circuits.',
    image: '/assets/components/buck_converter.jpg'
  },
  {
    id: 'protection',
    title: '10 A Fuse & Emergency Switch',
    category: 'Protection Circuit',
    spec: 'Overcurrent & Instant Disconnect',
    desc: 'The 10 A rated fuse safeguards circuits against current spikes, while the emergency stop switch provides an immediate hardware disconnect for safety.',
    image: '/assets/components/emergency_switch.png'
  },
  {
    id: 'terminals',
    title: 'Screw Terminal Blocks',
    category: 'Interconnects',
    spec: 'Heavy-Duty PCB Screw Terminals',
    desc: 'Provides secure, vibration-resistant connection points for power distribution, signal routing, servo cables, and sensor lines.',
    image: '/assets/components/terminal_blocks.png'
  },
  {
    id: 'aluminium',
    title: 'Aluminium Channels',
    category: 'Mechanical Framework',
    spec: '26 mm × 26 mm Extrusions',
    desc: 'Constructs the lightweight yet rigid structural framework for the arm links. Offers flat mounting surfaces and high bending stiffness during movement.',
    image: '/assets/components/aluminium_channel.jpg'
  },
  {
    id: 'metal_sheets',
    title: 'Metal Sheets',
    category: 'Fabrication Elements',
    spec: '2 mm & 4 mm Thickness',
    desc: 'Used to fabricate custom mounting brackets and motor supports. 2 mm sheets support light mounts, while 4 mm sheets provide high rigidity for high-torque joints.',
    image: '/assets/components/metal_sheets.jpg'
  },
  {
    id: 'wooden_plates',
    title: 'Dual Wooden Base Plates',
    category: 'Supporting Structure',
    spec: '300 mm × 300 mm × 10 mm (2 pcs)',
    desc: 'Two precision plates provide a stable supporting foundation for the robotic mechanism, accommodating applied arm moments and damping vibrations.',
    image: '/assets/components/wooden_plates.jpg'
  }
]

// Technical problem & solution based on Section 1, 2, 5 of PAPR technical documentation
export const SOLUTIONS = [
  {
    title: 'Camera Vision & Object Classification',
    desc: 'Camera observes the designated working area, capturing shape, size, orientation, and geometric features to determine item identity and sorting target.'
  },
  {
    title: 'Coordinate Calibration & Real-World Mapping',
    desc: 'Calibration procedures convert camera field-of-view pixels into real-world X, Y, and Z coordinates relative to the robotic arm coordinate frame.'
  },
  {
    title: 'Inverse Kinematic Trajectory Planning',
    desc: 'Analytical 3-link kinematic equations compute exact joint angles (θ₁, θ₂, θ₃) so the claw descends directly to object height without positioning errors.'
  },
  {
    title: 'Autonomous Gripping & Segregated Sorting',
    desc: 'ESP32 controller directs pincer claw closure, vertical lift clearance, spatial arc transfer, and controlled placement at assigned destination points.'
  }
]

