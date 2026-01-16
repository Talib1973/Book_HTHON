---
id: week-4-pub-sub
title: "Week 4: ROS 2 Publisher-Subscriber Pattern"
sidebar_position: 3
keywords: [ROS 2, publisher, subscriber, topic, message, pub-sub, rclpy]
dependencies: [week-3-ros2-architecture]
---

# Week 4: ROS 2 Publisher-Subscriber Pattern

## Learning Objectives

By the end of this week, you will be able to:

1. **Implement** both publisher and subscriber nodes using rclpy
2. **Understand** Quality of Service (QoS) profiles and their impact on message delivery
3. **Create** custom message types for domain-specific data
4. **Debug** publisher-subscriber connections using ros2cli tools
5. **Design** topic-based communication for real-time sensor data streaming

## Prerequisites

### Knowledge
- Completion of Week 3 (ROS 2 Architecture)
- Understanding of callback functions in Python
- Familiarity with ROS 2 message types (std_msgs, geometry_msgs)

### Software/Hardware
- ROS 2 Humble with workspace from Week 3
- Python 3.10+
- ros2cli tools installed

## Conceptual Explanation

### Publisher-Subscriber Pattern

The **pub-sub pattern** is ROS 2's primary mechanism for **asynchronous**, **one-to-many** data streaming.

**Key Characteristics**:
- **Decoupled**: Publishers don't know about subscribers (and vice versa)
- **Asynchronous**: Publishers don't wait for subscribers to process messages
- **Scalable**: One publisher can broadcast to unlimited subscribers
- **Real-time**: Ideal for high-frequency sensor data (camera, LIDAR, IMU)

### How It Works

1. **Publisher** creates a topic with a specific message type
2. **DDS Discovery**: Middleware announces topic availability
3. **Subscribers** register interest in the topic
4. **Message Flow**: Publisher sends messages → DDS routes to all subscribers
5. **Callbacks**: Each subscriber's callback executes independently

### Quality of Service (QoS)

QoS policies control **reliability**, **durability**, and **latency** trade-offs.

**Common QoS Profiles**:

| Profile | Reliability | Durability | Use Case |
|---------|-------------|------------|----------|
| **SENSOR_DATA** | Best effort | Volatile | High-frequency sensor streams (LIDAR, camera) |
| **RELIABLE** | Reliable | Volatile | Commands, control signals |
| **SYSTEM_DEFAULT** | Reliable | Volatile | General-purpose topics |

**QoS Parameters**:
- **Reliability**: Best-effort (UDP-like) vs Reliable (TCP-like with retries)
- **Durability**: Volatile (discard old messages) vs Transient-local (keep for late joiners)
- **History**: Keep-last-N vs Keep-all messages

## Hands-On Lab

### Task 1: Create Subscriber Node

Building on Week 3's publisher, create a subscriber that receives messages.

#### Step 1: Create Subscriber

```python title="subscriber.py"
#!/usr/bin/env python3
"""
Minimal ROS 2 subscriber node that listens to the 'chatter' topic.

This example demonstrates:
- Creating a subscription to std_msgs/String messages
- Implementing callback functions for message processing
- QoS profile configuration (default)
- Node lifecycle management
"""

import rclpy
from rclpy.node import Node
from std_msgs.msg import String


class MinimalSubscriber(Node):
    """A minimal subscriber node that receives Hello World messages."""

    def __init__(self):
        """Initialize the subscriber node with a subscription."""
        super().__init__('minimal_subscriber')

        # Create subscription: topic='/chatter', message_type=String, callback=listener_callback, queue_size=10
        self.subscription = self.create_subscription(
            String,
            'chatter',
            self.listener_callback,
            10
        )
        self.subscription  # Prevent unused variable warning

    def listener_callback(self, msg):
        """
        Callback function executed whenever a message is received.

        Args:
            msg (std_msgs.msg.String): The received message object
        """
        self.get_logger().info(f'I heard: "{msg.data}"')


def main(args=None):
    """Main entry point for the ROS 2 subscriber node."""
    rclpy.init(args=args)

    node = MinimalSubscriber()

    try:
        rclpy.spin(node)  # Keep node running and processing callbacks
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

#### Step 2: Update setup.py

Add subscriber entry point:

```python title="setup.py"
entry_points={
    'console_scripts': [
        'publisher = minimal_publisher.publisher:main',
        'subscriber = minimal_publisher.subscriber:main',
    ],
},
```

#### Step 3: Build and Test

```bash
cd ~/ros2_ws
colcon build --packages-select minimal_publisher
source install/setup.bash

# Terminal 1: Start publisher
ros2 run minimal_publisher publisher

# Terminal 2: Start subscriber
ros2 run minimal_publisher subscriber
```

**Expected Output (Subscriber Terminal)**:
```
[INFO] [minimal_subscriber]: I heard: "Hello World: 0"
[INFO] [minimal_subscriber]: I heard: "Hello World: 1"
[INFO] [minimal_subscriber]: I heard: "Hello World: 2"
```

### Task 2: Custom Message Type

Create a custom message for robot sensor data.

#### Step 1: Define Custom Message

Create `msg/SensorData.msg`:

```yaml title="msg/SensorData.msg"
# Custom message for robot sensor readings
# Demonstrates compound message types with primitives and arrays

std_msgs/Header header    # Timestamp and frame_id
float64 temperature       # Temperature in Celsius
float64 humidity          # Relative humidity (0-100%)
float64[] distances       # Array of distance measurements in meters
string sensor_id          # Unique sensor identifier
```

#### Step 2: Update package.xml

Add message dependencies:

```xml title="package.xml"
<build_depend>rosidl_default_generators</build_depend>
<exec_depend>rosidl_default_runtime</exec_depend>
<member_of_group>rosidl_interface_packages</member_of_group>
```

#### Step 3: Update CMakeLists.txt (for ament_cmake) or setup.py (for ament_python)

For ament_python packages, use:

```python title="setup.py"
from glob import glob
import os

# ...

data_files=[
    # ...
    (os.path.join('share', package_name, 'msg'), glob('msg/*.msg')),
],
```

#### Step 4: Publish Custom Message

```python title="sensor_publisher.py"
#!/usr/bin/env python3
"""
Publisher node for custom SensorData messages.

Demonstrates:
- Publishing custom message types
- Populating Header with timestamp
- Using arrays in messages
- Simulating sensor readings
"""

import rclpy
from rclpy.node import Node
from minimal_publisher.msg import SensorData  # Import custom message
from std_msgs.msg import Header
import random


class SensorPublisher(Node):
    """Publishes simulated sensor data at 10 Hz."""

    def __init__(self):
        """Initialize sensor publisher with timer."""
        super().__init__('sensor_publisher')

        self.publisher_ = self.create_publisher(SensorData, 'sensor_readings', 10)
        self.timer = self.create_timer(0.1, self.publish_sensor_data)  # 10 Hz

    def publish_sensor_data(self):
        """Generate and publish simulated sensor readings."""
        msg = SensorData()

        # Populate header with timestamp
        msg.header = Header()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'sensor_frame'

        # Simulate sensor readings
        msg.temperature = 20.0 + random.uniform(-5.0, 5.0)
        msg.humidity = 50.0 + random.uniform(-10.0, 10.0)
        msg.distances = [random.uniform(0.1, 5.0) for _ in range(8)]  # 8 distance sensors
        msg.sensor_id = 'env_sensor_01'

        self.publisher_.publish(msg)
        self.get_logger().info(f'Publishing: temp={msg.temperature:.2f}°C, humidity={msg.humidity:.1f}%')


def main(args=None):
    rclpy.init(args=args)
    node = SensorPublisher()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

### Task 3: QoS Configuration

Configure QoS for different reliability requirements.

```python title="qos_publisher.py"
"""
Demonstrate Quality of Service (QoS) configuration for publishers.

QoS profiles control message delivery guarantees, latency, and durability.
"""

from rclpy.qos import QoSProfile, ReliabilityPolicy, DurabilityPolicy, HistoryPolicy


# Sensor data: Best-effort, volatile (prioritize latency over reliability)
sensor_qos = QoSProfile(
    reliability=ReliabilityPolicy.BEST_EFFORT,  # Allow message loss
    durability=DurabilityPolicy.VOLATILE,       # Don't store for late joiners
    history=HistoryPolicy.KEEP_LAST,
    depth=10
)

# Command data: Reliable, volatile (ensure delivery, no history)
command_qos = QoSProfile(
    reliability=ReliabilityPolicy.RELIABLE,     # Retry until delivered
    durability=DurabilityPolicy.VOLATILE,
    history=HistoryPolicy.KEEP_LAST,
    depth=10
)

# Create publisher with custom QoS
self.publisher_ = self.create_publisher(String, 'sensor_data', sensor_qos)
```

## Debugging with ros2cli

### Inspect Topic Communication

```bash
# List all active topics
ros2 topic list

# Get topic info (type, publisher/subscriber count, QoS)
ros2 topic info /chatter

# Echo messages in real-time
ros2 topic echo /chatter

# Check message publishing rate
ros2 topic hz /chatter

# Get topic bandwidth usage
ros2 topic bw /chatter

# Publish from command line (for testing)
ros2 topic pub /chatter std_msgs/msg/String "data: 'Test message'"
```

### Inspect Node Communication

```bash
# Get node info (publishers, subscribers, services)
ros2 node info /minimal_publisher

# Check if topic has publishers
ros2 topic info /chatter --verbose
```

## Common Errors & Fixes

### Error 1: "No publishers available for topic"

**Cause**: Subscriber started before publisher, or publisher node crashed.

**Fix**:
- Verify publisher is running: `ros2 node list`
- Check topic exists: `ros2 topic list`
- Inspect QoS mismatch: `ros2 topic info /topic_name --verbose`

### Error 2: "QoS mismatch: Publisher and Subscriber have incompatible QoS"

**Cause**: Publisher uses BEST_EFFORT, subscriber requires RELIABLE (or vice versa).

**Fix**: Align QoS profiles between publisher and subscriber.

```python
# Subscriber must match publisher's QoS
self.subscription = self.create_subscription(
    String,
    'chatter',
    self.callback,
    qos_profile=sensor_qos  # Match publisher's QoS
)
```

### Error 3: "Message type mismatch"

**Cause**: Publisher and subscriber use different message types for same topic.

**Fix**: Ensure both use identical message type (e.g., `std_msgs/msg/String`).

### Error 4: "Callback not executing"

**Cause**: Node not spinning (`rclpy.spin()` not called).

**Fix**: Always call `rclpy.spin(node)` to process callbacks.

## External Resources

- [ROS 2 Topics Tutorial](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Topics/Understanding-ROS2-Topics.html)
- [QoS Policy Guide](https://docs.ros.org/en/humble/Concepts/About-Quality-of-Service-Settings.html)
- [std_msgs API](https://docs.ros2.org/latest/api/std_msgs/)
- [Custom Messages Tutorial](https://docs.ros.org/en/humble/Tutorials/Beginner-Client-Libraries/Custom-ROS2-Interfaces.html)

## Assessment Questions

1. **What happens if a subscriber is slow to process messages and the publisher queue fills up?**
   - A) Publisher blocks until subscriber catches up
   - B) Oldest messages are dropped (with KEEP_LAST policy)
   - C) ROS 2 throws an error
   - D) DDS buffers messages indefinitely

   *Answer: B*

2. **Which QoS reliability setting should be used for a 30 Hz camera stream?**
   - A) RELIABLE (every frame must arrive)
   - B) BEST_EFFORT (allow frame drops for low latency)
   - C) TRANSIENT_LOCAL
   - D) KEEP_ALL

   *Answer: B (BEST_EFFORT prioritizes latency over reliability for real-time sensor data)*

3. **How does a subscriber receive messages published before it started?**
   - A) Always receives all past messages
   - B) Only if QoS durability is TRANSIENT_LOCAL (not default VOLATILE)
   - C) Publisher must resend
   - D) Not possible in ROS 2

   *Answer: B*

4. **In the callback function `listener_callback(self, msg)`, what type is `msg`?**
   - A) String (Python built-in)
   - B) std_msgs.msg.String object
   - C) Dictionary
   - D) Byte array

   *Answer: B*

5. **What is the purpose of `self.subscription` line after `create_subscription()`?**
   - A) Start the subscription
   - B) Prevent Python garbage collector from deleting unused variable
   - C) Log subscription info
   - D) No purpose, can be removed

   *Answer: B*

6. **Can one subscriber listen to multiple topics?**
   - A) No, one subscriber per topic only
   - B) Yes, call `create_subscription()` multiple times with different topics
   - C) Yes, but only with custom message types
   - D) Only if topics have the same message type

   *Answer: B*

7. **Explain the difference between `ros2 topic echo` and `ros2 topic hz`.** (Short answer)

   *Expected answer: `ros2 topic echo` displays message content in real-time for debugging data values. `ros2 topic hz` measures and reports the publishing frequency (messages per second) to verify timing requirements.*

8. **Why use custom message types instead of std_msgs/String for all data?**

   *Expected answer: Custom messages provide type safety, enforce data structure, enable automatic serialization/deserialization, support code generation, and make message contracts explicit. Using String for everything requires manual parsing and loses compile-time type checking.*

9. **What is the queue_size parameter (depth) in `create_publisher()`?**
   - A) Maximum message size
   - B) Number of messages to buffer if network is slow
   - C) Number of subscribers allowed
   - D) Publishing frequency

   *Answer: B*

10. **How would you modify the publisher to send 100 messages per second?**

    *Expected answer: Change timer period to `self.create_timer(0.01, self.timer_callback)` (0.01 seconds = 100 Hz)*

## Further Reading

### Advanced Topics
- **Message Filters**: Synchronize multiple topics (e.g., camera + LIDAR)
- **tf2**: Transform coordinate frames between sensors
- **Bag Files**: Record and replay topic data with `ros2 bag`
- **Lifecycle Nodes**: Managed node states for production systems

### Performance Optimization
- **Zero-Copy**: Intra-process communication without serialization
- **DDS Tuning**: Optimize transport for specific network conditions
- **Callback Groups**: Parallelize callback execution with multi-threaded executors

## Next Steps

Continue to **Week 5: Services and Actions** to learn:
- Synchronous request-reply communication (services)
- Long-running tasks with feedback (actions)
- When to use topics vs services vs actions

<!-- PERSONALIZATION BUTTON -->
<!-- URDU TOGGLE -->
