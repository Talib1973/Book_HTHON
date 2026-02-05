---
id: week-4-pub-sub
title: "ہفتہ 4: ROS 2 Publisher-Subscriber پیٹرن"
sidebar_position: 3
keywords: [ROS 2, publisher, subscriber, topic, message, pub-sub, rclpy]
dependencies: [week-3-ros2-architecture]
language: ur
---

# ہفتہ 4: `ROS 2` `Publisher`-`Subscriber` پیٹرن

## سکھنے کے مقاصد

اس ہفتے کے آخر تک آپ درج ذیل کام کر سکیں گے:

1. **نفذ کریں** `rclpy` استعمال کرتے ہوئے `publisher` اور `subscriber` دونوں `node`ز
2. **سمجھیں** معیار کی خدمت (QoS) پروفائلز اور میسج کی ترسیل پر ان کا اثر
3. **بنائیں** ایک خاص شعبے کے ڈیٹا کے لیے کسٹم میسج ٹائپز
4. **ڈیبگ کریں** `ros2cli` ٹولز کا استعمال کرتے ہوئے `publisher`-`subscriber` کنکشنز
5. **ڈیزائن کریں** حقیقی وقت کے سنسر ڈیٹا سٹریمنگ کے لیے `topic` پر مبنی مواصلت

## پہلے سے درکار تقاضے

### علم
- ہفتہ 3 کی مکمل صورت (`ROS 2` آرکیٹیکچر)
- `Python` میں callback فنکشنز کی سمجھ
- `ROS 2` میسج ٹائپز سے آشنائی (`std_msgs`، `geometry_msgs`)

### سافٹ ویئر/ہاڈ ویئر
- `ROS 2 Humble` کے ساتھ ہفتہ 3 کا واークسپیس
- `Python` 3.10+
- `ros2cli` ٹولز انسٹول شدہ

## تصوراتی وضاحت

### `Publisher`-`Subscriber` پیٹرن

**pub-sub پیٹرن** `ROS 2` کا بے ترتیب، ایک سے بہت ڈیٹا سٹریمنگ کا بنیادی طریقہ کار ہے۔

**اہم خصوصیات**:
- **الگ الگ**: `publisher`ز `subscriber`ز کے بارے میں نہیں جانتے (اور اس کے بلعکس بھی)
- **بے ترتیب**: `publisher`ز `subscriber`ز کے میسجز کی عمل دہی کا انتظار نہیں کرتے
- **قابل پیمائش**: ایک `publisher` بے حساب `subscriber`ز کو نشر کر سکتا ہے
- **حقیقی وقت**: زیادہ فریکوینسی سنسر ڈیٹا کے لیے موزوں (کیمرا، LIDAR، IMU)

### یہ کیسے کام کرتا ہے

1. **`Publisher`** ایک مخصوص میسج ٹائپ کے ساتھ ایک `topic` بناتا ہے
2. **`DDS` ڈسکوری**: مڈل ویئر `topic` کی دستیابی کا اعلان کرتا ہے
3. **`Subscriber`ز** `topic` میں دلچسپی درج کرتے ہیں
4. **میسج کا بہاؤ**: `publisher` میسجز بھیجتا ہے، `DDS` تمام `subscriber`ز تک پہنچاتا ہے
5. **Callbacks**: ہر `subscriber` کا callback آزادانہ طور پر چلتا ہے

### معیار کی خدمت (QoS)

QoS پالیسیاں **قابل اعتماد**، **استحکام**، اور **تاخیر** کے سمجھوتوں کو کنٹرول کرتی ہیں۔

**عام QoS پروفائلز**:

| پروفائل | قابل اعتماد | استحکام | استعمال کی صورت |
|---------|-------------|---------|----------------|
| **SENSOR_DATA** | بہترین کوشش | متغیر | زیادہ فریکوینسی سنسر سٹریمز (LIDAR، کیمرا) |
| **RELIABLE** | قابل اعتماد | متغیر | کمانڈز، کنٹرول سگنلز |
| **SYSTEM_DEFAULT** | قابل اعتماد | متغیر | عام مقصد کے `topic`ز |

**QoS پیرامیٹرز**:
- **قابل اعتماد**: بہترین کوشش (UDP جیسا) بمقابلہ قابل اعتماد (TCP جیسا، دوبارہ کوشش کے ساتھ)
- **استحکام**: متغیر (پرانے میسجز ختم کریں) بمقابلہ Transient-local (دیر سے شامل ہونے والوں کے لیے رکھیں)
- **تاریخ**: آخری N رکھیں بمقابلہ تمام میسجز رکھیں

## ہاتھ سے عملداری کا درس

### کام 1: `Subscriber` `Node` بنائیں

ہفتہ 3 کے `publisher` پر بنیاد رکھتے ہوئے، ایک `subscriber` بنائیں جو میسجز ملتا ہے۔

#### مرحلہ 1: `Subscriber` بنائیں

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

#### مرحلہ 2: `setup.py` اپ ڈیٹ کریں

`subscriber` entry point شامل کریں:

```python title="setup.py"
entry_points={
    'console_scripts': [
        'publisher = minimal_publisher.publisher:main',
        'subscriber = minimal_publisher.subscriber:main',
    ],
},
```

#### مرحلہ 3: بلڈ کریں اور آزمائیں

```bash
cd ~/ros2_ws
colcon build --packages-select minimal_publisher
source install/setup.bash

# Terminal 1: Start publisher
ros2 run minimal_publisher publisher

# Terminal 2: Start subscriber
ros2 run minimal_publisher subscriber
```

**متوقع آؤٹ پٹ (`Subscriber` ٹرمینل)**:
```
[INFO] [minimal_subscriber]: I heard: "Hello World: 0"
[INFO] [minimal_subscriber]: I heard: "Hello World: 1"
[INFO] [minimal_subscriber]: I heard: "Hello World: 2"
```

### کام 2: کسٹم میسج ٹائپ

روبوٹ سنسر ڈیٹا کے لیے ایک کسٹم میسج بنائیں۔

#### مرحلہ 1: کسٹم میسج کی تعریف

`msg/SensorData.msg` بنائیں:

```yaml title="msg/SensorData.msg"
# Custom message for robot sensor readings
# Demonstrates compound message types with primitives and arrays

std_msgs/Header header    # Timestamp and frame_id
float64 temperature       # Temperature in Celsius
float64 humidity          # Relative humidity (0-100%)
float64[] distances       # Array of distance measurements in meters
string sensor_id          # Unique sensor identifier
```

#### مرحلہ 2: `package.xml` اپ ڈیٹ کریں

میسج کی درخواستیں شامل کریں:

```xml title="package.xml"
<build_depend>rosidl_default_generators</build_depend>
<exec_depend>rosidl_default_runtime</exec_depend>
<member_of_group>rosidl_interface_packages</member_of_group>
```

#### مرحلہ 3: `CMakeLists.txt` اپ ڈیٹ کریں (`ament_cmake` کے لیے) یا `setup.py` (`ament_python` کے لیے)

`ament_python` پیکیجز کے لیے، یہ استعمال کریں:

```python title="setup.py"
from glob import glob
import os

# ...

data_files=[
    # ...
    (os.path.join('share', package_name, 'msg'), glob('msg/*.msg')),
],
```

#### مرحلہ 4: کسٹم میسج شائع کریں

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

### کام 3: QoS کنفیگریشن

مختلف قابل اعتماد تقاضوں کے لیے QoS ترتیب دیں۔

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

## `ros2cli` کے ذریعے ڈیبگنگ

### `Topic` مواصلت کی جانچ

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

### `Node` مواصلت کی جانچ

```bash
# Get node info (publishers, subscribers, services)
ros2 node info /minimal_publisher

# Check if topic has publishers
ros2 topic info /chatter --verbose
```

## عام غلطیاں اور حل

### غلطی 1: "`topic` کے لیے کوئی `publisher` دستیاب نہیں"

**وجہ**: `subscriber` `publisher` سے پہلے شروع ہوا، یا `publisher` `node` گر گیا۔

**حل**:
- یقینی بنائیں کہ `publisher` چل رہا ہے: `ros2 node list`
- دیکھیں کہ `topic` موجود ہے: `ros2 topic list`
- QoS کی بے اتفاقی کی جانچ کریں: `ros2 topic info /topic_name --verbose`

### غلطی 2: "QoS مسمّہ: `Publisher` اور `Subscriber` کے QoS متوافق نہیں"

**وجہ**: `publisher` BEST_EFFORT استعمال کرتا ہے، `subscriber` RELIABLE کی فرمائش کرتا ہے (یا اس کے بلعکس)۔

**حل**: `publisher` اور `subscriber` کے درمیان QoS پروفائلز کو ایک جیسا کریں۔

```python
# Subscriber must match publisher's QoS
self.subscription = self.create_subscription(
    String,
    'chatter',
    self.callback,
    qos_profile=sensor_qos  # Match publisher's QoS
)
```

### غلطی 3: "میسج ٹائپ کی بے اتفاقی"

**وجہ**: `publisher` اور `subscriber` ایک ہی `topic` کے لیے مختلف میسج ٹائپز استعمال کرتے ہیں۔

**حل**: یقینی بنائیں کہ دونوں ایک ہی میسج ٹائپ استعمال کرتے ہیں (مثلاً `std_msgs/msg/String`)۔

### غلطی 4: "Callback نہیں چل رہا"

**وجہ**: `node` spin نہیں کر رہا (`rclpy.spin()` نہیں کال کیا گیا)۔

**حل**: Callbacks کی عمل دہی کے لیے ہمیشہ `rclpy.spin(node)` کال کریں۔

## بیرونی وسائل

- [`ROS 2` `Topic`ز کا ٹیوٹورل](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Topics/Understanding-ROS2-Topics.html)
- [QoS پالیسی گائیڈ](https://docs.ros.org/en/humble/Concepts/About-Quality-of-Service-Settings.html)
- [`std_msgs` API](https://docs.ros2.org/latest/api/std_msgs/)
- [کسٹم میسجز کا ٹیوٹورل](https://docs.ros.org/en/humble/Tutorials/Beginner-Client-Libraries/Custom-ROS2-Interfaces.html)

## جانچ کے سوال

1. **اگر `subscriber` میسجز کی عمل دہی میں سست ہو اور `publisher` کی قطار بھر جائے تو کیا ہوگا؟**
   - A) `publisher` رکے گا جب تک `subscriber` پکڑ نہیں لیتا
   - B) پرانے میسجز گرا دیے جائیں گے (KEEP_LAST پالیسی کے ساتھ)
   - C) `ROS 2` غلطی دے گا
   - D) `DDS` میسجز بے حساب بفر کرے گا

   *جواب: B*

2. **30 Hz کیمرا سٹریم کے لیے کونسا QoS قابل اعتماد ترتیب استعمال کیا جانا چاہیے؟**
   - A) RELIABLE (ہر فریم آنا ضروری ہے)
   - B) BEST_EFFORT (کم تاخیر کے لیے فریم گرانے کی اجازت دیں)
   - C) TRANSIENT_LOCAL
   - D) KEEP_ALL

   *جواب: B (BEST_EFFORT حقیقی وقت کے سنسر ڈیٹا کے لیے قابل اعتماد کی بجائے تاخیر کو ترجیح دیتا ہے)*

3. **`subscriber` شروع ہونے سے پہلے شائع شدہ میسجز کیسے ملتے ہیں؟**
   - A) ہمیشہ پرانے تمام میسجز ملتے ہیں
   - B) صرف اگر QoS durability TRANSIENT_LOCAL ہو (بنیادی VOLATILE نہیں)
   - C) `publisher` کو دوبارہ بھیجنا ہوگا
   - D) `ROS 2` میں ممکن نہیں

   *جواب: B*

4. **Callback فنکشن `listener_callback(self, msg)` میں `msg` کا ٹائپ کیا ہے؟**
   - A) String (`Python` کا بنیادی)
   - B) `std_msgs.msg.String` آبجیکٹ
   - C) ڈکشنری
   - D) Byte array

   *جواب: B*

5. **`create_subscription()` کے بعد `self.subscription` لائن کا مقصد کیا ہے؟**
   - A) سبسکرپشن شروع کریں
   - B) `Python` کے garbage collector کو غیر استعمال شدہ متغیر حذف کرنے سے روکیں
   - C) سبسکرپشن کی معلومات لاگ کریں
   - D) کوئی مقصد نہیں، ہٹایا جا سکتا ہے

   *جواب: B*

6. **کیا ایک `subscriber` متعدد `topic`ز سن سکتا ہے؟**
   - A) نہیں، ایک `topic` فی `subscriber` صرف
   - B) ہاں، مختلف `topic`ز کے ساتھ `create_subscription()` متعدد بار کال کریں
   - C) ہاں، لیکن صرف کسٹم میسج ٹائپز کے ساتھ
   - D) صرف اگر `topic`ز کا ایک ہی میسج ٹائپ ہو

   *جواب: B*

7. **`ros2 topic echo` اور `ros2 topic hz` کا فرق بیان کریں۔** (مختصر جواب)

   *متوقع جواب: `ros2 topic echo` ڈیبگنگ ڈیٹا قدروں کے لیے حقیقی وقت میں میسج کا مواد دکھاتا ہے۔ `ros2 topic hz` شائع کرنے کی فریکوینسی (میسجز فی سیکنڈ) ماپتا ہے اور رپورٹ کرتا ہے تاکہ وقت کی فرمائشوں کی تصدیق ہو سکے۔*

8. **تمام ڈیٹا کے لیے `std_msgs/String` کی بجائے کسٹم میسج ٹائپز کیوں استعمال کریں؟**

   *متوقع جواب: کسٹم میسجز ٹائپ سلامتی فراہت کرتے ہیں، ڈیٹا کی ترکیب نافذ کرتے ہیں، خودکار serialization/deserialization ممکن بناتے ہیں، کوڈ جنریشن کی حمایت کرتے ہیں، اور میسج کے معاہدوں کو واضح کرتے ہیں۔ ہر چیز کے لیے `String` استعمال کرنے میں دستی parsing ضروری ہے اور compile-time ٹائپ جانچ کھو جاتی ہے۔*

9. **`create_publisher()` میں `queue_size` پیرامیٹر (depth) کیا ہے؟**
   - A) میسجز کا زیادہ سے زیادہ حجم
   - B) اگر نیٹ ورک سست ہو تو میسجز کا بفر نمبر
   - C) اجازت شدہ `subscriber`ز کا نمبر
   - D) شائع کرنے کی فریکوینسی

   *جواب: B*

10. **`publisher` کو فی سیکنڈ 100 میسجز بھیجنے کے لیے کیسے تبدیل کریں گے؟**

    *متوقع جواب: ٹائمر کی مدت `self.create_timer(0.01, self.timer_callback)` میں تبدیل کریں (0.01 سیکنڈ = 100 Hz)*

## گہری پڑھائی

### جدید موضوعات
- **میسج فلٹرز**: متعدد `topic`ز کو سنکرون کریں (مثلاں کیمرا + LIDAR)
- **`tf2`**: سنسرز کے درمیان coordinate فریمز کی تبدیلی
- **Bag فائلز**: `ros2 bag` کے ذریعے `topic` ڈیٹا رکارڈ اور دوبارہ چلائیں
- **Lifecycle نوڈز**: پیشہ ورانہ سسٹمز کے لیے مہتمم `node` حالتیں

### پرفورمنس کی بہتری
- **Zero-Copy**: serialization کے بغیر اندرونی عمل کی مواصلت
- **`DDS` Tuning**: مخصوص نیٹ ورک حالات کے لیے ٹرانسپورٹ بہتر کریں
- **Callback گروہز**: متعدد گھاتی ایکسیکیوٹرز کے ساتھ Callback کی عمل دہی متوازن کریں

## اگلے قدم

**ہفتہ 5: `Service`ز اور `Action`ز** کی طرف آگے بڑھیں تاکہ سیکھ سکیں:
- سنکرونس درخواست-جواب مواصلت (`service`ز)
- فیڈ بیک کے ساتھ طویل مدتی کام (`action`ز)
- `topic`ز بمقابلہ `service`ز بمقابلہ `action`ز کب استعمال کریں

<!-- PERSONALIZATION BUTTON -->
<!-- URDU TOGGLE -->
