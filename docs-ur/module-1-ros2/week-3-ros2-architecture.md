---
id: week-3-ros2-architecture
title: "ہفتہ 3: ROS 2 آرکیٹیکچر"
sidebar_position: 2
keywords: [ROS 2, architecture, nodes, topics, services, actions, DDS, middleware]
dependencies: []
language: ur
---

# ہفتہ 3: `ROS 2` آرکیٹیکچر

## سکھنے کے مقاصد

اس ہفتے کے آخر تک آپ درج ذیل کام کر سکیں گے:

1. **بیان کریں** `ROS 2` آرکیٹیکچر کے بنیادی اجزاء (`node`ز، `topic`ز، `service`ز، `action`ز، پیرامیٹرز)
2. **سمجھیں** کہ `DDS` مڈل ویئر کی تہ `node`ز کے درمیان مواصلت کیسے ممکن بناتی ہے
3. **بنائیں** `Python` (`rclpy`) استعمال کرتے ہوئے ایک سادہ `ROS 2` `node`
4. **استعمال کریں** `ros2cli` ٹولز کو چلتے ہوئے `node`ز کی جانچ اور ڈیبگنگ کے لیے
5. **فرق بیان کریں** سنکرونس (`service`ز) اور بے ترتیب (`topic`ز، `action`ز) مواصلتی پیٹرنز میں

## پہلے سے درکار تقاضے

### علم
- `Python` 3.10+ پروگرامنگ (کلاسز، فنکشنز، async/await)
- تقسیم شدہ سسٹمز کی بنیادی سمجھ
- `Linux` کمانڈ لائن سے آشنائی

### سافٹ ویئر/ہاڈ ویئر
- `Ubuntu` 22.04 LTS (نیٹیو یا `WSL2`)
- `ROS 2 Humble` Hawksbill انسٹول شدہ - [`انسٹولیشن گائیڈ`](https://docs.ros.org/en/humble/Installation.html)
- `Python` 3 ڈیولپمنٹ ٹولز (`python3-dev`، `python3-pip`)
- کوڈ ایڈیٹر (`VS Code` تجویز کردہ، `ROS` ایکسٹینشن کے ساتھ)

## تصوراتی وضاحت

### `ROS 2` کیا ہے؟

`ROS 2` (Robot Operating System 2) کوئی آپریٹنگ سسٹم نہیں ہے بلکہ یہ ایک **مڈل ویئر فریم ورک** ہے جو درج ذیل فراہت کرتا ہے:

- **مواصلتی بنیادی ڈھانچہ**: `node`ز `topic`ز، `service`ز، اور `action`ز کے ذریعے میسجز کا تبادلہ کرتے ہیں
- **بلڈ سسٹم**: پیکیجز کمپائل کرنے کے لیے `Colcon`
- **کمانڈ لائن ٹولز**: چلتے ہوئے سسٹمز کی جانچ اور وضاحت
- **قیاسی لائبریریز**: رائضیات، جیومیٹری، ٹرانسفارمز، سنسر ڈرائیورز

`ROS 2` **حقیقی وقت**، **تقسیم شدہ**، **پیشہ ورانہ معیار** کے روبوٹکس سسٹمز کے لیے ڈیزائن کیا گیا ہے۔

### بنیادی تصورات

#### 1. نوڈز (`Nodes`)

ایک **`node`** ایک آزاد عمل ہے جو ایک مخصوص کام انجام دیتا ہے (مثلاً سنسر ڈرائیور، موشن پلانر، کنٹرول)۔

**اہم خصوصیات**:
- `node`ز خرابی کی الگائی کے لیے الگ الگ عمل میں چلتے ہیں
- `DDS` مڈل ویئر کے ذریعے مواصلت کرتے ہیں (کوئی مشترکہ میموری نہیں)
- `Python` (`rclpy`) یا C++ (`rclcpp`) میں لکھے جا سکتے ہیں

**استعمال کی مثالیں**:
- کیمرا ڈرائیور `node` تصویریں شائع کرتا ہے
- آبجیکٹ ڈٹیکشن `node` تصوراتی خاکوں سے سبسکرائب کرتا ہے، باؤنڈنگ باکسز شائع کرتا ہے
- پاتھ پلانر `node` خط مسافت کی حساب کے لیے ایک `service` فراہت کرتا ہے

#### 2. ٹاپکز (`Topics`) - شائع کرنا اور سبسکرائب کرنا

**`Topic`ز** **بے ترتیب**، **ایک سے بہت** مواصلت ممکن بناتے ہیں۔

**یہ کیسے کام کرتا ہے**:
1. `publisher` ایک `topic` بناتا ہے (مثلاً `/camera/image_raw`)
2. `subscriber` اس `topic` میں دلچسپی درج کرتا ہے
3. `DDS` مڈل ویئر میسجز کو `publisher` سے تمام `subscriber`ز تک پہنچاتا ہے

**استعمال کی صورتحال**:
- سنسر ڈیٹا سٹریمنگ (LIDAR اسکینز، کیمرا تصویریں)
- روبوٹ کی حالت کا نشریات (odometry، جوائنٹ حالتیں)
- بہت زیادہ فریکوینسی ڈیٹا (100+ Hz)

**خاکہ**:

<img src="/img/ros2-architecture.svg" alt="ROS 2 architecture diagram showing multiple publisher and subscriber nodes communicating via topics through the DDS middleware layer. The diagram illustrates one-to-many message routing where a single camera publisher sends images to multiple subscriber nodes (object detector, SLAM, display). The DDS layer sits between all nodes and handles message transport, discovery, and quality of service policies." />

*شکل 1: `ROS 2` `Topic` مواصلتی آرکیٹیکچر*

#### 3. سروسز (`Services`) - درخواست اور جواب

**`Service`ز** **سنکرونس**، **ایک سے ایک** مواصلت ممکن بناتے ہیں۔

**یہ کیسے کام کرتا ہے**:
1. `client` `service` کو درخواست بھیجتا ہے (مثلاً `/compute_trajectory`)
2. `server` درخواست کی عمل دہی کرتا ہے (اس میں وقت لگ سکتا ہے)
3. `server` جواب واپس `client` کو بھیجتا ہے
4. `client` جواب ملنے تک رکا رہتا ہے

**استعمال کی صورتحال**:
- کم وقوعہ آپریشنز (موٹرز شروع/بند کریں، حالت ریسیٹ کریں)
- تصدیق کی ضرورت والے آپریشنز (inverse kinematics، پاتھ پلاningنگ)
- کنفیگریشن سوال (پیرامیٹرز حاصل کریں، صلاحیتیں دیکھیں)

#### 4. ایکشنز (`Actions`) - طویل مدتی کام

**`Action`ز** **بے ترتیب**، **طویل مدتی** آپریشنز کو **فیڈ بیک** کے ساتھ ممکن بناتے ہیں۔

**یہ کیسے کام کرتا ہے**:
1. `client` `action server` کو گول بھیجتا ہے (مثلاں `/navigate_to_pose`)
2. `server` گول کی عمل دہی کرتا ہے اور وقتاً فوقتاً فیڈ بیک بھیجتا ہے (ترقی کی اطلاعات)
3. `client` عمل دہی کے دورانیے میں گول منسوخ کر سکتا ہے
4. `server` مکمل ہونے پر حتمی نتیجہ بھیجتا ہے

**استعمال کی صورتحال**:
- نیوگیشن (ہدف کی جگہ پر جائیں، ترقی کی اطلاعات بھیجیں)
- مینپولیشن (آبجیکٹ گراسپ کریں، گریپر کی طاقت کا فیڈ بیک دیں)
- کوئی بھی کام جو 1 سیکنڈ سے زیادہ وقت لے

#### 5. `DDS` مڈل ویئر

`ROS 2` بنیادی مواصلت کے لیے **`DDS` (Data Distribution Service)** استعمال کرتا ہے۔

**اہم خصوصیات**:
- **ڈسکوری**: `node`ز خودکار طور پر ایک دوسرے کو تلاش کر لیتے ہیں (`ROS 1` کی طرح کوئی مسٹر `node` نہیں)
- **معیار کی خدمت (QoS)**: قابل اعتماد، استحکام، تاخیر کی ترتیب دیں
- **سلامتی**: مکوف مواصلت کے لیے `DDS-Security`

**`DDS` کی درخور تنفیذیں**:
- `Fast DDS` (`Humble` میں بنیادی)
- `Cyclone DDS`
- `RTI Connext DDS`

## ہاتھ سے عملداری کا درس

### کام: اپنا پہلا `ROS 2` `Node` بنائیں

ایک مختصر `ROS 2` `node` بنائیں جو ایک `topic` پر "Hello World" میسجز شائع کرتا ہے۔

#### مرحلہ 1: واークسپیس بنائیں

```bash
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws/src
```

#### مرحلہ 2: پیکیج بنائیں

```bash
ros2 pkg create --build-type ament_python minimal_publisher --dependencies rclpy std_msgs
cd minimal_publisher/minimal_publisher
```

#### مرحلہ 3: `Publisher` `Node` لکھیں

`publisher.py` بنائیں:

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

#### مرحلہ 4: `setup.py` اپ ڈیٹ کریں

`setup.py` میں entry point شامل کریں:

```python title="setup.py"
entry_points={
    'console_scripts': [
        'publisher = minimal_publisher.publisher:main',
    ],
},
```

#### مرحلہ 5: بلڈ کریں اور چلائیں

```bash
cd ~/ros2_ws
colcon build --packages-select minimal_publisher
source install/setup.bash
ros2 run minimal_publisher publisher
```

**متوقع آؤٹ پٹ**:

```
[INFO] [minimal_publisher]: Publishing: "Hello World: 0"
[INFO] [minimal_publisher]: Publishing: "Hello World: 1"
[INFO] [minimal_publisher]: Publishing: "Hello World: 2"
```

#### مرحلہ 6: `ros2cli` سے جانچیں

ایک نیا ٹرمینل میں:

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

## عام غلطیاں اور حل

### غلطی 1: "ModuleNotFoundError: No module named 'rclpy'"

**وجہ**: `ROS 2` کا ماحول سورس نہیں کیا گیا۔

**حل**:
```bash
source /opt/ros/humble/setup.bash
```

خودکار سورسنگ کے لیے `~/.bashrc` میں شامل کریں:
```bash
echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc
```

### غلطی 2: "Package 'minimal_publisher' not found"

**وجہ**: `colcon build` کے بعد واークسپیس سورس نہیں کیا گیا۔

**حل**:
```bash
source ~/ros2_ws/install/setup.bash
```

### غلطی 3: "TypeError: __init__() takes 1 positional argument but 2 were given"

**وجہ**: `__init__` میں `super().__init__('node_name')` نہیں لکھا گیا۔

**حل**: یقینی بنائیں کہ ہر `Node` کی فرعی کلاس میں پہلے `super().__init__('node_name')` کال کیا گیا ہو۔

## بیرونی وسائل

- [`ROS 2 Humble` دستاویزات](https://docs.ros.org/en/humble/) - تصورات، ٹیوٹورلز، API کے لیے سرکاری دستاویزات
- [`rclpy` API حوالہ](https://docs.ros2.org/latest/api/rclpy/) - `Python` کلائنٹ لائبریری کی دستاویزات
- [`ROS 2` ڈیزائن کے فیصلے](https://design.ros2.org/) - `ROS 1` سے `ROS 2` کیوں دوبارہ ڈیزائن کیا گیا
- [`DDS` کی وضاحت](https://www.omg.org/spec/DDS/) - بنیادی مڈل ویئر پروٹوکل
- [`Fast DDS` دستاویزات](https://fast-dds.docs.eprosima.com/) - `Humble` میں بنیادی `DDS` تنفیذ

## جانچ کے سوال

1. **`ROS 2` میں `DDS` مڈل ویئر کی تہ کا بنیادی کردار کیا ہے؟**
   - A) پیکیجز کمپائل کریں
   - B) `node`ز کے درمیان ڈسکوری اور میسج روٹنگ فراہت کریں
   - C) روبوٹ ہاڈ ویئر ڈرائیورز سنبھالیں
   - D) کنفیگریشن فائلیں محفوظ کریں

   *جواب: B*

2. **زیادہ فریکوینسی سنسر ڈیٹا (100 Hz) کے لیے کونسا مواصلتی پیٹرن سب سے مناسب ہے؟**
   - A) `Service`ز (درخواست-جواب)
   - B) `Action`ز (گول-فیڈ بیک-نتیجہ)
   - C) `Topic`ز (شائع کریں-سبسکرائب کریں)
   - D) پیرامیٹرز

   *جواب: C*

3. **اگر `subscriber` `publisher` کے میسجز بھیجنے کے بعد `topic` میں شامل ہو جائے تو کیا ہوگا؟**
   - A) `subscriber` گزشتہ تمام میسجز ملے گا
   - B) `subscriber` صرف نئے میسجز ملے گا (بنیادی QoS)
   - C) `ROS 2` غلطی دے گا
   - D) `publisher` تمام میسجز دوبارہ بھیجے گا

   *جواب: B (QoS durability ترتیب پر منحصر ہے، لیکن بنیادی volatile ہے)*

4. **`ROS 2` میں ہر `node` کے لیے الگ الگ عمل کیوں استعمال کیے جاتے ہیں بجائے threads کے؟**
   - A) تیز مواصلت
   - B) خرابی کی الگائی (ایک `node` کی خرابی دوسروں کو نہیں مارتی)
   - C) آسان ڈیبگنگ
   - D) `DDS` کی فرمائش

   *جواب: B*

5. **کونسا `ros2cli` کمانڈ ایک `topic` کی میسج ٹائپ دکھاتا ہے؟**
   - A) `ros2 topic list`
   - B) `ros2 topic echo /topic_name`
   - C) `ros2 topic info /topic_name`
   - D) `ros2 node info /node_name`

   *جواب: C*

6. **`create_publisher()` میں `queue_size` پیرامیٹر کا مقصد کیا ہے؟**
   - A) میسجز کا زیادہ سے زیادہ حجم bytes میں
   - B) اگر `subscriber` سست ہو تو میسجز کا بفر نمبر
   - C) شائع کرنے کی فریکوینسی
   - D) اجازت شدہ `subscriber`ز کا نمبر

   *جواب: B*

7. **`topic`ز اور `service`ز کا فرق بیان کریں۔** (مختصر جواب)

   *متوقع جواب: `Topic`ز بے ترتیب، ایک سے بہت، آتشنار مواصلت ہیں جو ڈیٹا سٹریمنگ کے لیے ہیں۔ `Service`ز سنکرونس، ایک سے ایک، درخواست-جواب ہیں جو تصدیق کی ضرورت والے آپریشنز کے لیے ہیں۔ `Topic`ز `publisher` کو نہیں روکتے؛ `service`ز `client` کو اس وقت تک روکتے ہیں جب تک `server` جواب نہیں دیتا۔*

8. **کوڈ کی مثال میں `rclpy.spin(node)` کیا کرتا ہے؟**
   - A) روبوٹ کو گھمائے
   - B) `node` کو چلتا رکھے اور callbacks کی عمل دہی کرے
   - C) میسجز شائع کرے
   - D) ایک نیا thread بنائے

   *جواب: B*

9. **مثال میں 2 Hz کی بجائے 10 Hz پر شائع کرنے کے لیے کیا تبدیلی کریں گے؟**

   *متوقع جواب: `self.create_timer(0.5, self.timer_callback)` کو `self.create_timer(0.1, self.timer_callback)` میں تبدیل کریں (0.1 سیکنڈ = 10 Hz)۔*

10. **مسٹر `node` کے حوالے سے `ROS 2` کا `ROS 1` پر کیا فائدہ ہے؟**
    - A) `ROS 2` کا مسٹر تیز ہے
    - B) `ROS 2` میں کوئی واحد ناکامی کا نکتہ نہیں ہے (کوئی مسٹر `node` نہیں)
    - C) `ROS 2` کا مسٹر روبوٹ پر چلتا ہے
    - D) `ROS 2` کو متعدد مسٹرز کی ضرورت ہے

    *جواب: B*

## گہری پڑھائی

### تحقیقی مضامین
- [`ROS 2`: اگلی نسل کا `Robot Operating System`](https://www.ros.org/news/2016/07/ros2.html) - سرکاری `ROS 2` ڈیزائن کے مقاصد
- [`DDS` حقیقی وقت کے سسٹمز کے لیے](https://www.omg.org/news/whitepapers/dds.pdf) - `DDS` پروٹوکل کی سفیدی کاغذ

### جدید موضوعات
- **معیار کی خدمت (QoS) پالیسیاں**: مختلف استعمال کی صورتحال کے لیے قابل اعتماد، استحکام، تاخیر ترتیب دیں
- **`ROS 2` سلامتی**: تصدیق، خفیہ کاری، رسائی کی نگرانی کے لیے `DDS-Security`
- **حقیقی وقت کے سسٹمز**: قطعی پرفورمنس کے لیے حقیقی وقت کی kernels (RT_PREEMPT) کے ساتھ انتگریشن
- **متعدد روبوٹ سسٹمز**: روبوٹ فلیٹز کے لیے نیم نام (Namespace) اور ڈومین ID کی زیراگری

### ویڈیو ٹیوٹورلز
- [`ROS 2` ٹیوٹورلز کی فہرست](https://www.youtube.com/playlist?list=PLLSegLrePWgIbIrA4iehUQ-impvIXdd9Q) - Articulated Robotics `ROS 2 Humble` سیریز
- [`ROS 2` ڈیزائن کا جائزہ](https://vimeo.com/106992622) - Brian Gerkey کی `ROS 2` آرکیٹیکچر کے بارے میں گفتگو

## اگلے قدم

**ہفتہ 4: `Publisher`-`Subscriber` پیٹرن** کی طرف آگے بڑھیں تاکہ یہ سیکھ سکیں:
- `subscriber` `node`ز بنائیں
- کسٹم میسج ٹائپز کی تعریف کریں
- مختلف میسج فریکوینسیز سنبھالیں
- `publisher`-`subscriber` کنکشنز کی ڈیبگنگ کریں

<!-- PERSONALIZATION BUTTON -->
<!-- URDU TOGGLE -->
