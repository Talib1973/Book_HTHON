---
id: week-3-ros2-architecture
title: "Week 3: ROS 2 Architecture"
sidebar_position: 2
keywords: [ROS 2, architecture, nodes, topics, services, actions, DDS, middleware]
dependencies: []
---

# Week 3: ROS 2 Architecture

## Learning Objectives

By the end of this week, you will be able to:

1. **Explain** the core components of ROS 2 architecture (nodes, topics, services, actions, parameters)
2. **Understand** how the DDS middleware layer enables communication between nodes
3. **Build** a simple ROS 2 node using Python (rclpy)
4. **Use** ros2cli tools to inspect and debug running nodes
5. **Differentiate** between synchronous (services) and asynchronous (topics, actions) communication patterns

## Prerequisites

### Knowledge
- Python 3.10+ programming (classes, functions, async/await)
- Basic understanding of distributed systems
- Linux command-line familiarity

### Software/Hardware
- Ubuntu 22.04 LTS (native or WSL2)
- ROS 2 Humble Hawksbill installed - [Installation Guide](https://docs.ros.org/en/humble/Installation.html)
- Python 3 development tools (`python3-dev`, `python3-pip`)
- Code editor (VS Code recommended with ROS extension)

## Conceptual Explanation

### What is ROS 2?

ROS 2 (Robot Operating System 2) is not an operating system but a **middleware framework** that provides:

- **Communication infrastructure**: Nodes exchange messages via topics, services, and actions
- **Build system**: Colcon for compiling packages
- **Command-line tools**: Debug and introspect running systems
- **Standard libraries**: Math, geometry, transforms, sensor drivers

ROS 2 is designed for **real-time**, **distributed**, **production-grade** robotics systems.

### Core Concepts

#### 1. Nodes

A **node** is an independent process that performs a specific task (e.g., sensor driver, motion planner, controller).

**Key Properties**:
- Nodes run in separate processes for fault isolation
- Communicate via DDS middleware (no shared memory)
- Can be written in Python (rclpy) or C++ (rclcpp)

**Example Use Cases**:
- Camera driver node publishes images
- Object detection node subscribes to images, publishes bounding boxes
- Path planner node provides a service to compute trajectories

#### 2. Topics (Publish-Subscribe)

**Topics** enable **asynchronous**, **one-to-many** communication.

**How It Works**:
1. Publisher creates a topic (e.g., `/camera/image_raw`)
2. Subscriber registers interest in the topic
3. DDS middleware routes messages from publisher to all subscribers

**Use Cases**:
- Sensor data streaming (LIDAR scans, camera images)
- Robot state broadcasts (odometry, joint states)
- High-frequency data (100+ Hz)

**Diagram**:

<img src="/img/ros2-architecture.svg" alt="ROS 2 architecture diagram showing multiple publisher and subscriber nodes communicating via topics through the DDS middleware layer. The diagram illustrates one-to-many message routing where a single camera publisher sends images to multiple subscriber nodes (object detector, SLAM, display). The DDS layer sits between all nodes and handles message transport, discovery, and quality of service policies." />

*Figure 1: ROS 2 Topic Communication Architecture*

#### 3. Services (Request-Reply)

**Services** enable **synchronous**, **one-to-one** communication.

**How It Works**:
1. Client sends request to service (e.g., `/compute_trajectory`)
2. Server processes request (may take time)
3. Server sends reply back to client
4. Client blocks until reply received

**Use Cases**:
- Infrequent operations (start/stop motors, reset state)
- Operations requiring confirmation (inverse kinematics, path planning)
- Configuration queries (get parameters, check capabilities)

#### 4. Actions (Long-Running Tasks)

**Actions** enable **asynchronous**, **long-running** operations with **feedback**.

**How It Works**:
1. Client sends goal to action server (e.g., `/navigate_to_pose`)
2. Server processes goal and sends periodic feedback (progress updates)
3. Client can cancel goal mid-execution
4. Server sends final result when complete

**Use Cases**:
- Navigation (move to target pose, send progress updates)
- Manipulation (grasp object, report gripper force feedback)
- Any task taking >1 second

#### 5. DDS Middleware

ROS 2 uses **DDS (Data Distribution Service)** for underlying communication.

**Key Features**:
- **Discovery**: Nodes automatically find each other (no master node like ROS 1)
- **Quality of Service (QoS)**: Configure reliability, durability, latency
- **Security**: DDS-Security for encrypted communication

**Supported DDS Implementations**:
- Fast DDS (default in Humble)
- Cyclone DDS
- RTI Connext DDS

## Hands-On Lab

### Task: Build Your First ROS 2 Node

Create a minimal ROS 2 node that publishes "Hello World" messages to a topic.

#### Step 1: Create Workspace

```bash
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws/src
```

#### Step 2: Create Package

```bash
ros2 pkg create --build-type ament_python minimal_publisher --dependencies rclpy std_msgs
cd minimal_publisher/minimal_publisher
```

#### Step 3: Write Publisher Node

Create `publisher.py`:

```python title="publisher.py"
#!/usr/bin/env python3
"""
Minimal ROS 2 publisher node that publishes string messages to the 'chatter' topic.

This example demonstrates:
- Basic ROS 2 node setup with rclpy
- Creating a publisher for std_msgs/String messages
- Timer-based periodic publishing
- Node lifecycle management (init, spin, shutdown)
"""

import rclpy
from rclpy.node import Node
from std_msgs.msg import String


class MinimalPublisher(Node):
    """A minimal publisher node that sends Hello World messages."""

    def __init__(self):
        """Initialize the publisher node with a timer and publisher."""
        super().__init__('minimal_publisher')

        # Create publisher: topic='/chatter', message_type=String, queue_size=10
        self.publisher_ = self.create_publisher(String, 'chatter', 10)

        # Create timer: period=0.5 seconds (2 Hz), callback=self.timer_callback
        self.timer = self.create_timer(0.5, self.timer_callback)

        self.i = 0  # Message counter

    def timer_callback(self):
        """Timer callback that publishes a message every 0.5 seconds."""
        msg = String()
        msg.data = f'Hello World: {self.i}'

        self.publisher_.publish(msg)
        self.get_logger().info(f'Publishing: "{msg.data}"')

        self.i += 1


def main(args=None):
    """Main entry point for the ROS 2 node."""
    rclpy.init(args=args)

    node = MinimalPublisher()

    try:
        rclpy.spin(node)  # Keep node running until Ctrl+C
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

#### Step 4: Update setup.py

Edit `setup.py` to add the entry point:

```python title="setup.py"
entry_points={
    'console_scripts': [
        'publisher = minimal_publisher.publisher:main',
    ],
},
```

#### Step 5: Build and Run

```bash
cd ~/ros2_ws
colcon build --packages-select minimal_publisher
source install/setup.bash
ros2 run minimal_publisher publisher
```

**Expected Output**:

```
[INFO] [minimal_publisher]: Publishing: "Hello World: 0"
[INFO] [minimal_publisher]: Publishing: "Hello World: 1"
[INFO] [minimal_publisher]: Publishing: "Hello World: 2"
```

#### Step 6: Inspect with ros2cli

In a new terminal:

```bash
# List running nodes
ros2 node list

# Get node info
ros2 node info /minimal_publisher

# List topics
ros2 topic list

# Echo messages
ros2 topic echo /chatter

# Get topic info
ros2 topic info /chatter
```

## Common Errors & Fixes

### Error 1: "ModuleNotFoundError: No module named 'rclpy'"

**Cause**: ROS 2 environment not sourced.

**Fix**:
```bash
source /opt/ros/humble/setup.bash
```

Add to `~/.bashrc` to auto-source:
```bash
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
```

### Error 2: "Package 'minimal_publisher' not found"

**Cause**: Workspace not sourced after `colcon build`.

**Fix**:
```bash
source ~/ros2_ws/install/setup.bash
```

### Error 3: "TypeError: __init__() takes 1 positional argument but 2 were given"

**Cause**: Missing `super().__init__('node_name')` in `__init__`.

**Fix**: Ensure every Node subclass calls `super().__init__('node_name')` first.

## External Resources

- [ROS 2 Humble Documentation](https://docs.ros.org/en/humble/) - Official docs for concepts, tutorials, API
- [rclpy API Reference](https://docs.ros2.org/latest/api/rclpy/) - Python client library documentation
- [ROS 2 Design Decisions](https://design.ros2.org/) - Why ROS 2 was redesigned from ROS 1
- [DDS Specification](https://www.omg.org/spec/DDS/) - Underlying middleware protocol
- [Fast DDS Documentation](https://fast-dds.docs.eprosima.com/) - Default DDS implementation in Humble

## Assessment Questions

1. **What is the primary role of the DDS middleware layer in ROS 2?**
   - A) Compile packages
   - B) Provide discovery and message routing between nodes
   - C) Manage robot hardware drivers
   - D) Store configuration files

   *Answer: B*

2. **Which communication pattern is best for high-frequency sensor data (100 Hz)?**
   - A) Services (request-reply)
   - B) Actions (goal-feedback-result)
   - C) Topics (publish-subscribe)
   - D) Parameters

   *Answer: C*

3. **What happens if a subscriber joins a topic after the publisher has already sent messages?**
   - A) Subscriber receives all past messages
   - B) Subscriber only receives new messages (default QoS)
   - C) ROS 2 throws an error
   - D) Publisher resends all messages

   *Answer: B (depends on QoS durability setting, but default is volatile)*

4. **Why does ROS 2 use separate processes for each node instead of threads?**
   - A) Faster communication
   - B) Fault isolation (one node crash doesn't kill others)
   - C) Easier to debug
   - D) Required by DDS

   *Answer: B*

5. **Which ros2cli command shows the message type of a topic?**
   - A) `ros2 topic list`
   - B) `ros2 topic echo /topic_name`
   - C) `ros2 topic info /topic_name`
   - D) `ros2 node info /node_name`

   *Answer: C*

6. **What is the purpose of the queue_size parameter in create_publisher()?**
   - A) Maximum message size in bytes
   - B) Number of messages to buffer if subscriber is slow
   - C) Frequency of publishing
   - D) Number of subscribers allowed

   *Answer: B*

7. **Explain the difference between topics and services.** (Short answer)

   *Expected answer: Topics are asynchronous, one-to-many, fire-and-forget communication for streaming data. Services are synchronous, one-to-one, request-reply for operations requiring confirmation. Topics don't block the publisher; services block the client until the server replies.*

8. **In the code example, what does `rclpy.spin(node)` do?**
   - A) Rotates the robot
   - B) Keeps the node running and processing callbacks
   - C) Publishes messages
   - D) Creates a new thread

   *Answer: B*

9. **How would you modify the example to publish at 10 Hz instead of 2 Hz?**

   *Expected answer: Change `self.create_timer(0.5, self.timer_callback)` to `self.create_timer(0.1, self.timer_callback)` (0.1 seconds = 10 Hz).*

10. **What is the advantage of ROS 2 over ROS 1 in terms of master node?**
    - A) ROS 2 has a faster master
    - B) ROS 2 has no single point of failure (no master node)
    - C) ROS 2 master runs on the robot
    - D) ROS 2 requires multiple masters

    *Answer: B*

## Further Reading

### Research Papers
- [ROS 2: The Next Generation Robot Operating System](https://www.ros.org/news/2016/07/ros2.html) - Official ROS 2 design goals
- [DDS for Real-Time Systems](https://www.omg.org/news/whitepapers/dds.pdf) - DDS protocol whitepaper

### Advanced Topics
- **Quality of Service (QoS) Policies**: Configure reliability, durability, latency for different use cases
- **ROS 2 Security**: DDS-Security for authentication, encryption, access control
- **Real-Time Systems**: Integrate with real-time kernels (RT_PREEMPT) for deterministic performance
- **Multi-Robot Systems**: Namespace and domain ID management for robot fleets

### Video Tutorials
- [ROS 2 Tutorials Playlist](https://www.youtube.com/playlist?list=PLLSegLrePWgIbIrA4iehUQ-impvIXdd9Q) - Articulated Robotics ROS 2 Humble series
- [ROS 2 Design Overview](https://vimeo.com/106992622) - Brian Gerkey's talk on ROS 2 architecture

## Next Steps

Continue to **Week 4: Publisher-Subscriber Pattern** to learn how to:
- Create subscriber nodes
- Define custom message types
- Handle different message frequencies
- Debug publisher-subscriber connections

<!-- PERSONALIZATION BUTTON -->
<!-- URDU TOGGLE -->
