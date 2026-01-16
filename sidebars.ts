import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const sidebars: SidebarsConfig = {
  roboticsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Module 1: The Robotic Nervous System (ROS 2)',
      items: [
        'module-1-ros2/index',
        'module-1-ros2/week-3-ros2-architecture',
        'module-1-ros2/week-4-pub-sub',
        'module-1-ros2/week-5-services-actions',
      ],
    },
    {
      type: 'category',
      label: 'Module 2: Digital Twin (Gazebo & Unity)',
      items: [
        'module-2-digital-twin/index',
      ],
    },
    {
      type: 'category',
      label: 'Module 3: NVIDIA Isaac Sim',
      items: [
        'module-3-isaac/index',
      ],
    },
    {
      type: 'category',
      label: 'Module 4: Vision-Language-Action (VLA)',
      items: [
        'module-4-vla/index',
      ],
    },
    {
      type: 'category',
      label: 'Capstone Project',
      items: [
        'capstone/index',
      ],
    },
  ],
};

export default sidebars;
