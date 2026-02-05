---
id: week-5-services-actions
title: "ہفتہ 5: ROS 2 Services اور Actions"
sidebar_position: 4
keywords: [ROS 2, services, actions, client, server, request, reply, goal, feedback]
dependencies: [week-3-ros2-architecture, week-4-pub-sub]
language: ur
---

# ہفتہ 5: `ROS 2` `Service`ز اور `Action`ز

## سکھنے کے مقاصد

اس ہفتے کے آخر تک آپ درج ذیل کام کر سکیں گے:

1. **فرق بیان کریں** مواصلتی پیٹرنز کی بنیاد پر `topic`ز، `service`ز، اور `action`ز میں
2. **نفذ کریں** سنکرونس درخواست-جواب آپریشنز کے لیے `service` `client`ز اور `server`ز
3. **بنائیں** گول سنبھالنے، فیڈ بیک، اور منسوخی کے ساتھ `action server`ز
4. **ڈیزائن کریں** مناسب مواصلتی بنیادی ڈھانچوں کا استعمال کرتے ہوئے روبوٹ کنٹرول سسٹمز
5. **سنبھالیں** متوازی `service` درخواستیں اور `action` preemption

## پہلے سے درکار تقاضے

### علم
- ہفتہ 3 (`ROS 2` آرکیٹیکچر) اور ہفتہ 4 (Pub-Sub) کی مکمل صورت
- بے ترتیب پروگرامنگ کے تصورات کی سمجھ
- `Python` کلاسز اور Callbacks سے آشنائی

### سافٹ ویئر/ہاڈ ویئر
- پچھلے ہفتوں کا `ROS 2 Humble` واークسپیس
- `Python` 3.10+
- `ros2cli` ٹولز

## تصوراتی وضاحت

### مواصلتی پیٹرنز کا موازنہ

| پیٹرن | سنکرونس | مدت | فیڈ بیک | استعمال کی صورت |
|--------|---------|-----|---------|----------------|
| **`Topic`** | بے ترتیب | مسلسل | نہیں | سنسر سٹریمز (کیمرا، LIDAR) |
| **`Service`** | سنکرونس | مختصر (1 سیکنڈ سے کم) | نہیں | کنفیگریشن سوال، سادہ کمانڈز |
| **`Action`** | بے ترتیب | طویل (1 سیکنڈ سے زیادہ) | ہاں | نیوگیشن، مینپولیشن، طویل کام |

### `Service`ز (درخواست-جواب)

**`Service`ز** **سنکرونس**، **ایک سے ایک**، **رکاوٹ والی** مواصلت فراہت کرتے ہیں۔

**یہ کیسے کام کرتا ہے**:
1. **`Client`** `service` endpoint پر درخواست بھیجتا ہے
2. **`Client` رکا رہتا ہے** جواب کا انتظار میں (یا async callback استعمال کرتا ہے)
3. **`Server`** درخواست کی عمل دہی کرتا ہے (حساب، I/O، وغیرہ)
4. **`Server`** جواب واپس `client` کو بھیجتا ہے
5. **`Client`** جواب ملتا ہے اور عمل جاری رکھتا ہے

**اہم خصوصیات**:
- **رکاوٹ والی**: `client` `server` کا جواب کا انتظار کرتا ہے (timeout ممکن ہے)
- **ایک سے ایک**: ایک درخواست فی `client` (البتہ متعدد `client`ز ایک ہی `service` کال کر سکتے ہیں)
- **بغیر حالت**: ہر درخواست آزاد ہے
- **قابل اعتماد**: قابل اعتماد QoS پر بنیاد (TCP جیسا)

**استعمال کی مثالیں**:
- روبوٹ کی بیٹری کا سطح حاصل کریں
- inverse kinematics حساب کریں
- odometry ریسیٹ کریں
- ایمرجنسی stop ٹریگر کریں
- میپ کی جسامت سوال کریں

### `Action`ز (گول-فیڈ بیک-نتیجہ)

**`Action`ز** **بے ترتیب**، **طویل مدتی** کام فراہت کرتے ہیں **ترقی کے فیڈ بیک** اور **منسوخی** کے ساتھ۔

**یہ کیسے کام کرتا ہے**:
1. **`Client`** `action server` کو گول بھیجتا ہے (مثلاں "pose X پر نیوگیٹ کریں")
2. **`Server`** گول قبول یا رد کرتا ہے
3. **`Server`** گول کی عمل دہی کرتا ہے، وقتاً فوقتاں فیڈ بیک بھیجتا ہے (مثلاں "50% مکمل")
4. **`Client`** عمل دہی کے دورانیے میں گول منسوخ کر سکتا ہے
5. **`Server`** مکمل ہونے پر حتمی نتیجہ بھیجتا ہے (کامیابی/ناکامی)

**`Action` کے اجزاء**:
- **گول**: مطلوب آخری حالت (مثلاں ہدف pose، آبجیکٹ گراسپ کریں)
- **فیڈ بیک**: وقتاں وقتاں ترقی کی اطلاعات (مثلاں باقی مسافت، موجودہ گریپر کی طاقت)
- **نتیجہ**: حتمی نتیجہ (کامیابی، ناکامی، وجہ)

**استعمال کی مثالیں**:
- واے پوئنٹ پر نیوگیٹ کریں (فیڈ بیک: باقی مسافت، متوقع آنے کا وقت)
- آبجیکٹ اٹھائیں اور رکھیں (فیڈ بیک: گریپر کی طاقت، آبجیکٹ پہنچنے کا اشارہ)
- بیٹری چارج کریں (فیڈ بیک: موجودہ چارجنگ فیصد)
- خط مسافت نفذ کریں (فیڈ بیک: موجودہ جوائنٹ حالتیں)

### کب کیا استعمال کریں

**`Topic`ز استعمال کریں جب**:
- ڈیٹا مسلسل بہتا ہے (سنسرز، odometry)
- کم تاخیر درکار ہو
- متعدد `subscriber`ز کو ایک ہی ڈیٹا کی ضرورت ہو
- آتشنار (تصدیق کی ضرورت نہیں)

**`Service`ز استعمال کریں جب**:
- مکمل ہونے کی تصدیق درکار ہو
- مختصر آپریشن (1 سیکنڈ سے کم)
- درخواست-جواب پیٹرن فطری طور پر مناسب ہو
- کنفیگریشن یا حالت کے سوال

**`Action`ز استعمال کریں جب**:
- آپریشن 1 سیکنڈ سے زیادہ وقت لے
- ترقی کا فیڈ بیک درکار ہو
- منسوخی کی ضرورت ہو
- طویل مدتی کام (نیوگیشن، مینپولیشن)

## ہاتھ سے عملداری کا درس

### کام 1: `Service Server` بنائیں

ایک `service` نفذ کریں جو دو اعداد جوڑتا ہے۔

#### مرحلہ 1: `Service` کی تعریف بنائیں

بنیادی `service`ز کے لیے، `example_interfaces/srv/AddTwoInts` استعمال کریں:

```
int64 a
int64 b
---
int64 sum
```

#### مرحلہ 2: `Service Server` نفذ کریں

```python title="add_two_ints_server.py"
#!/usr/bin/env python3
"""
Service server that adds two integers.

Demonstrates:
- Creating a service server
- Processing requests and sending responses
- Error handling and logging
- Service lifecycle management
"""

import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts


class AddTwoIntsServer(Node):
    """Service server that performs integer addition."""

    def __init__(self):
        """Initialize the service server."""
        super().__init__('add_two_ints_server')

        # Create service: name='/add_two_ints', type=AddTwoInts, callback=add_two_ints_callback
        self.srv = self.create_service(
            AddTwoInts,
            'add_two_ints',
            self.add_two_ints_callback
        )

        self.get_logger().info('Add Two Ints service ready.')

    def add_two_ints_callback(self, request, response):
        """
        Service callback that processes addition requests.

        Args:
            request (AddTwoInts.Request): Request object with 'a' and 'b' fields
            response (AddTwoInts.Response): Response object to populate with 'sum'

        Returns:
            AddTwoInts.Response: Populated response object
        """
        response.sum = request.a + request.b

        self.get_logger().info(
            f'Incoming request: a={request.a}, b={request.b} -> sum={response.sum}'
        )

        return response


def main(args=None):
    """Main entry point for service server."""
    rclpy.init(args=args)

    node = AddTwoIntsServer()

    try:
        rclpy.spin(node)  # Keep server running
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
```

#### مرحلہ 3: `Service Client` نفذ کریں

```python title="add_two_ints_client.py"
#!/usr/bin/env python3
"""
Service client that calls AddTwoInts service.

Demonstrates:
- Creating a service client
- Waiting for service availability
- Sending synchronous requests
- Handling responses and timeouts
"""

import sys
import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts


class AddTwoIntsClient(Node):
    """Service client for adding two integers."""

    def __init__(self):
        """Initialize the service client."""
        super().__init__('add_two_ints_client')

        # Create client: service_name='/add_two_ints', service_type=AddTwoInts
        self.cli = self.create_client(AddTwoInts, 'add_two_ints')

        # Wait for service to become available (timeout: 1 second)
        while not self.cli.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('Service not available, waiting...')

        self.get_logger().info('Service available!')

    def send_request(self, a, b):
        """
        Send addition request to service.

        Args:
            a (int): First integer
            b (int): Second integer

        Returns:
            int: Sum of a and b
        """
        # Create request object
        request = AddTwoInts.Request()
        request.a = a
        request.b = b

        # Call service (blocking call)
        future = self.cli.call_async(request)

        # Wait for response
        rclpy.spin_until_future_complete(self, future)

        if future.result() is not None:
            response = future.result()
            self.get_logger().info(f'Result: {a} + {b} = {response.sum}')
            return response.sum
        else:
            self.get_logger().error('Service call failed')
            return None


def main(args=None):
    """Main entry point for service client."""
    rclpy.init(args=args)

    # Parse command-line arguments
    if len(sys.argv) < 3:
        print('Usage: ros2 run minimal_publisher add_two_ints_client <a> <b>')
        return

    a = int(sys.argv[1])
    b = int(sys.argv[2])

    # Create client and send request
    node = AddTwoIntsClient()
    node.send_request(a, b)

    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
```

#### مرحلہ 4: بلڈ کریں اور آزمائیں

```bash
cd ~/ros2_ws
colcon build --packages-select minimal_publisher
source install/setup.bash

# Terminal 1: Start service server
ros2 run minimal_publisher add_two_ints_server

# Terminal 2: Call service from client
ros2 run minimal_publisher add_two_ints_client 5 7

# Or call service from command line
ros2 service call /add_two_ints example_interfaces/srv/AddTwoInts "{a: 10, b: 20}"
```

**متوقع آؤٹ پٹ**:
```
# Server terminal:
[INFO] [add_two_ints_server]: Incoming request: a=5, b=7 -> sum=12

# Client terminal:
[INFO] [add_two_ints_client]: Result: 5 + 7 = 12
```

### کام 2: `Action Server` بنائیں

فیڈ بیک کے ساتھ Fibonacci سیریز کی جنریشن کے لیے ایک `action` نفذ کریں۔

#### مرحلہ 1: `Action` کی تعریف بنائیں

`action/Fibonacci.action` بنائیں:

```
# Goal: Generate Fibonacci sequence up to order n
int32 order
---
# Result: Complete sequence
int32[] sequence
---
# Feedback: Current partial sequence
int32[] partial_sequence
```

#### مرحلہ 2: `Action Server` نفذ کریں

```python title="fibonacci_action_server.py"
#!/usr/bin/env python3
"""
Action server that generates Fibonacci sequence.

Demonstrates:
- Creating an action server
- Accepting/rejecting goals
- Sending periodic feedback
- Handling goal cancellation
- Returning final result
"""

import time
import rclpy
from rclpy.node import Node
from rclpy.action import ActionServer, CancelResponse, GoalResponse
from minimal_publisher.action import Fibonacci


class FibonacciActionServer(Node):
    """Action server for Fibonacci sequence generation."""

    def __init__(self):
        """Initialize the action server."""
        super().__init__('fibonacci_action_server')

        # Create action server
        self._action_server = ActionServer(
            self,
            Fibonacci,
            'fibonacci',
            execute_callback=self.execute_callback,
            goal_callback=self.goal_callback,
            cancel_callback=self.cancel_callback
        )

        self.get_logger().info('Fibonacci action server ready.')

    def goal_callback(self, goal_request):
        """
        Called when a new goal is received.

        Args:
            goal_request (Fibonacci.Goal): The goal request

        Returns:
            GoalResponse: ACCEPT or REJECT
        """
        self.get_logger().info(f'Received goal request: order={goal_request.order}')

        # Reject negative or excessively large orders
        if goal_request.order < 0 or goal_request.order > 50:
            self.get_logger().warn('Rejecting goal: invalid order')
            return GoalResponse.REJECT

        return GoalResponse.ACCEPT

    def cancel_callback(self, goal_handle):
        """
        Called when a client requests goal cancellation.

        Args:
            goal_handle: Handle to the goal being cancelled

        Returns:
            CancelResponse: ACCEPT or REJECT cancellation
        """
        self.get_logger().info('Received cancellation request')
        return CancelResponse.ACCEPT

    def execute_callback(self, goal_handle):
        """
        Execute the Fibonacci generation goal.

        Args:
            goal_handle: Handle to the accepted goal

        Returns:
            Fibonacci.Result: The final result
        """
        self.get_logger().info('Executing goal...')

        # Initialize feedback message
        feedback_msg = Fibonacci.Feedback()
        feedback_msg.partial_sequence = [0, 1]

        # Generate Fibonacci sequence
        for i in range(1, goal_handle.request.order):
            # Check if goal was cancelled
            if goal_handle.is_cancel_requested:
                goal_handle.canceled()
                self.get_logger().info('Goal cancelled')
                return Fibonacci.Result()

            # Compute next Fibonacci number
            next_num = feedback_msg.partial_sequence[i] + feedback_msg.partial_sequence[i - 1]
            feedback_msg.partial_sequence.append(next_num)

            # Publish feedback
            goal_handle.publish_feedback(feedback_msg)
            self.get_logger().info(f'Feedback: {feedback_msg.partial_sequence}')

            # Simulate computation time
            time.sleep(0.5)

        # Goal succeeded
        goal_handle.succeed()

        # Return final result
        result = Fibonacci.Result()
        result.sequence = feedback_msg.partial_sequence
        self.get_logger().info(f'Returning result: {result.sequence}')

        return result


def main(args=None):
    """Main entry point for action server."""
    rclpy.init(args=args)

    node = FibonacciActionServer()

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

#### مرحلہ 3: `Action` آزمائیں

```bash
# Terminal 1: Start action server
ros2 run minimal_publisher fibonacci_action_server

# Terminal 2: Send action goal from command line
ros2 action send_goal /fibonacci minimal_publisher/action/Fibonacci "{order: 10}" --feedback
```

**متوقع آؤٹ پٹ**:
```
# Server terminal:
[INFO] [fibonacci_action_server]: Feedback: [0, 1, 1]
[INFO] [fibonacci_action_server]: Feedback: [0, 1, 1, 2]
[INFO] [fibonacci_action_server]: Feedback: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
[INFO] [fibonacci_action_server]: Returning result: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

## `ros2cli` کے ذریعے ڈیبگنگ

### `Service` کی ڈیبگنگ

```bash
# List all services
ros2 service list

# Get service type
ros2 service type /add_two_ints

# Call service
ros2 service call /add_two_ints example_interfaces/srv/AddTwoInts "{a: 5, b: 3}"

# Find services of a specific type
ros2 service find example_interfaces/srv/AddTwoInts
```

### `Action` کی ڈیبگنگ

```bash
# List all actions
ros2 action list

# Get action info
ros2 action info /fibonacci

# Send action goal with feedback
ros2 action send_goal /fibonacci minimal_publisher/action/Fibonacci "{order: 5}" --feedback
```

## عام غلطیاں اور حل

### غلطی 1: "`Service server` جواب نہیں دے رہا"

**وجہ**: `Service server` `node` نہیں چل رہا یا نام کی بے اتفاقی۔

**حل**:
```bash
# Verify server is running
ros2 node list

# Check service exists
ros2 service list

# Verify service name matches client
```

### غلطی 2: "`Action` گول رد کیا گیا"

**وجہ**: `Server` کا `goal_callback` نے `GoalResponse.REJECT` واپس کیا۔

**حل**: رد کرنے کی وجہ کے لیے `server` کی لاگز دیکھیں (غلط پیرامیٹرز، وسیلے دستیاب نہیں، وغیرہ)۔

### غلطی 3: "`Service` کا انتظار میں Timeout"

**وجہ**: `wait_for_service()` کا Timeout گزر گیا۔

**حل**: Timeout بڑھائیں یا یقینی بنائیں کہ `server` `client` سے پہلے شروع ہو۔

### غلطی 4: "`Future` کبھی مکمل نہیں ہوتا"

**وجہ**: `spin_until_future_complete()` کبھی کال نہیں کیا گیا یا executor نہیں چل رہا۔

**حل**: `call_async()` کے بعد ہمیشہ `rclpy.spin_until_future_complete(node, future)` کال کریں۔

## بیرونی وسائل

- [`ROS 2` `Service`ز کا ٹیوٹورل](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Services/Understanding-ROS2-Services.html)
- [`ROS 2` `Action`ز کا ٹیوٹورل](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Actions/Understanding-ROS2-Actions.html)
- [`Action` ڈیزائن گائیڈ](https://design.ros2.org/articles/actions.html)
- [`example_interfaces` پیکیج](https://github.com/ros2/example_interfaces)

## جانچ کے سوال

1. **`Service`ز اور `Topic`ز میں کیا بنیادی فرق ہے؟**
   - A) `Service`ز تیز ہیں
   - B) `Service`ز سنکرونس ہیں اور `client` کو روکتے ہیں
   - C) `Service`ز TCP کی بجائے UDP استعمال کرتے ہیں
   - D) `Service`ز متعدد `subscriber`ز کی حمایت کرتے ہیں

   *جواب: B*

2. **`Service` کی بجائے `Action` کب استعمال کرنا چاہیے؟**
   - A) جب آپ کو جواب کی ضرورت ہو
   - B) جب آپریشن 1 سیکنڈ سے زیادہ وقت لے اور فیڈ بیک کی ضرورت ہو
   - C) جب زیادہ فریکوینسی مواصلت درکار ہو
   - D) جب متعدد `client`ز شامل ہوں

   *جواب: B*

3. **`Action` کی تعریف کے تین اجزاء کیا ہیں؟**
   - A) درخواست، جواب، فیڈ بیک
   - B) گول، فیڈ بیک، نتیجہ
   - C) داخلہ، آؤٹ پٹ، حالت
   - D) شروع، ترقی، آخر

   *جواب: B*

4. **کیا ایک `service server` متعدد `client`ز کو بیک وقت سنبھال سکتا ہے؟**
   - A) نہیں، صرف ایک `client` فی `server`
   - B) ہاں، لیکن صرف متعدد گھاتی ایکسیکیوٹرز کے ساتھ
   - C) ہاں، درخواستیں قطار میں آتی ہیں اور ترتیب سے عمل میں آتی ہیں
   - D) صرف اگر `client`ز async کالز استعمال کریں

   *جواب: C (بنیادی طور پر، واحد گھاتی executor درخواستیں ترتیب سے عمل میں لاتا ہے)*

5. **اگر `action client` عمل دہی کے دورانیے میں گول منسوخ کر دے تو کیا ہوگا؟**
   - A) `Server` فوراً صفائی کے بغیر رک جائے گا
   - B) `Server` کا `cancel_callback` کال ہوگا، `server` منسوخی قبول یا رد کر سکتا ہے
   - C) گول مکمل ہونے تک جاری رہے گا
   - D) `ROS 2` غلطی دے گا

   *جواب: B*

6. **`Service client` کال کرنے سے پہلے کیسے جانتا ہے کہ `server` موجود ہے؟**
   - A) کال کریں اور exceptions پکڑیں
   - B) `wait_for_service()` طریقہ استعمال کریں
   - C) دستی طور پر `ros2 service list` دیکھیں
   - D) `Service`ز ہمیشہ موجود ہوتے ہیں

   *جواب: B*

7. **بیان کریں کہ نیوگیشن کیوں `Service` کی بجائے `Action` استعمال کرے گا۔** (مختصر جواب)

   *متوقع جواب: نیوگیشن میں متعدد سیکنڈز/منٹز لگتے ہیں مکمل ہونے میں، مسلسل فیڈ بیک کی ضرورت ہوتی ہے (باقی مسافت، موجودہ pose)، اور اگر روبوٹ کوئی رکاوٹ محسوس کرے یا صارف منصوبہ بدلے تو منسوخی ضروری ہو سکتی ہے۔ `Action`ز گول-فیڈ بیک-نتیجہ پیٹرن فراہت کرتے ہیں منسوخی کی حمایت کے ساتھ، جو `Service`ز کے پاس نہیں ہے۔*

8. **`rclpy.spin_until_future_complete()` کیا کرتا ہے؟**
   - A) روبوٹ کی موٹرز گھمائے
   - B) بے ترتیب `service` کال مکمل ہونے یا Timeout ہونے تک رکے
   - C) کسی `topic` پر شائع کرے
   - D) ایک نیا thread بنائے

   *جواب: B*

9. **کیا آپ ایک ہی `service` نام کے ساتھ متعدد `service server`ز بنا سکتے ہیں؟**
   - A) ہاں، `ROS 2` درخواستوں کو متوازن کرے گا
   - B) نہیں، اس سے نام کی تکرار کی غلطی آئے گی
   - C) ہاں، لیکن صرف مختلف نیم ناموں میں
   - D) صرف اگر ان کے مختلف میسج ٹائپز ہوں

   *جواب: C (مختلف نیم ناموں کے ساتھ، مثلاں `/robot1/add_two_ints` اور `/robot2/add_two_ints`)*

10. **ایک `service` کی تعریف لکھیں جو ایک string لیتا ہے اور اس کی لمبائی واپس کرتا ہے۔** (مختصر جواب)

    *متوقع جواب:*
    ```
    string input_string
    ---
    int32 length
    ```

## گہری پڑھائی

### جدید موضوعات
- **Async `Service` کالز**: Callbacks کے ساتھ غیر رکاوٹ والے `service` `client`ز
- **متعدد گھاتی ایکسیکیوٹرز**: متوازی `service`/`action` عمل دہی
- **نیم نام اور Re-mapping**: ایک ہی `service`ز کے ساتھ متعدد روبوٹز کی زیراگری
- **`Service` ڈسکوری**: متحرک `service` تلاش اور خودکار جانچ

### حقیقی دنیا کی درخواستیں
- **MoveIt2**: خط مسافت کی عمل دہی کے لیے `action server`ز کے ساتھ موشن پلاningنگ
- **Nav2**: گول بھیجنے پر مبنی `action` کے ساتھ نیوگیشن سٹیک
- **مینپولیشن**: گراسپ پلاningنگ `service`ز، گریپر کنٹرول `action`ز
- **متعدد روبوٹ سسٹمز**: فلیٹ کی زیراگری کے لیے مرکزی `service`ز

## اگلے قدم

**مبارکباد!** آپ نے ماڈیول 1: روبوٹ کا اعصابی نظام (`ROS 2`) مکمل کر لیا ہے۔

آپ اب سمجھتے ہیں:
- `ROS 2` آرکیٹیکچر (`node`ز، `DDS`، مڈل ویئر)
- بے ترتیب ڈیٹا سٹریمز کے لیے `Publisher`-`Subscriber` پیٹرن
- سنکرونس درخواست-جواب آپریشنز کے لیے `Service`ز
- فیڈ بیک کے ساتھ طویل مدتی کاموں کے لیے `Action`ز

**ماڈیول 2: ڈیجیٹل ٹوین (`Gazebo` اور `Unity`)** کی طرف آگے بڑھیں تاکہ سیکھ سکیں کہ ہاڈ ویئر پر ڈیپلوئی سے پہلے فزیکس پر مبنی حقیقی ماحول میں اپنے `ROS 2` `node`ز کو کیسے سمیول اور آزمائیں۔

<!-- PERSONALIZATION BUTTON -->
<!-- URDU TOGGLE -->
