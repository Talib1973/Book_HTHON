---
id: week-5-services-actions
title: "Week 5: ROS 2 Services and Actions"
sidebar_position: 4
keywords: [ROS 2, services, actions, client, server, request, reply, goal, feedback]
dependencies: [week-3-ros2-architecture, week-4-pub-sub]
---

# Week 5: ROS 2 Services and Actions

## Learning Objectives

By the end of this week, you will be able to:

1. **Differentiate** between topics, services, and actions based on communication patterns
2. **Implement** service clients and servers for synchronous request-reply operations
3. **Build** action servers with goal handling, feedback, and cancellation
4. **Design** robot control systems using appropriate communication primitives
5. **Handle** concurrent service requests and action preemption

## Prerequisites

### Knowledge
- Completion of Week 3 (ROS 2 Architecture) and Week 4 (Pub-Sub)
- Understanding of asynchronous programming concepts
- Familiarity with Python classes and callbacks

### Software/Hardware
- ROS 2 Humble workspace from previous weeks
- Python 3.10+
- ros2cli tools

## Conceptual Explanation

### Communication Pattern Comparison

| Pattern | Synchronous | Duration | Feedback | Use Case |
|---------|-------------|----------|----------|----------|
| **Topic** | Asynchronous | Continuous | No | Sensor streams (camera, LIDAR) |
| **Service** | Synchronous | Short (less than 1s) | No | Configuration queries, simple commands |
| **Action** | Asynchronous | Long (over 1s) | Yes | Navigation, manipulation, long tasks |

### Services (Request-Reply)

**Services** provide **synchronous**, **one-to-one**, **blocking** communication.

**How It Works**:
1. **Client** sends request to service endpoint
2. **Client blocks** waiting for response (or uses async callback)
3. **Server** processes request (computation, I/O, etc.)
4. **Server** sends reply back to client
5. **Client receives** reply and continues execution

**Key Characteristics**:
- **Blocking**: Client waits for server response (can timeout)
- **One-to-one**: One client per request (though multiple clients can call same service)
- **Stateless**: Each request is independent
- **Reliable**: Built on reliable QoS (TCP-like)

**Example Use Cases**:
- Get robot battery level
- Compute inverse kinematics
- Reset odometry
- Trigger emergency stop
- Query map dimensions

### Actions (Goal-Feedback-Result)

**Actions** provide **asynchronous**, **long-running** tasks with **progress feedback** and **cancellation**.

**How It Works**:
1. **Client** sends goal to action server (e.g., "navigate to pose X")
2. **Server** accepts/rejects goal
3. **Server** executes goal, periodically sending feedback (e.g., "50% complete")
4. **Client** can cancel goal mid-execution
5. **Server** sends final result when complete (success/failure)

**Action Components**:
- **Goal**: Desired end state (e.g., target pose, grasp object)
- **Feedback**: Periodic progress updates (e.g., distance remaining, current gripper force)
- **Result**: Final outcome (success, failure, reason)

**Example Use Cases**:
- Navigate to waypoint (feedback: distance remaining, ETA)
- Pick and place object (feedback: gripper force, object detected)
- Charge battery (feedback: current charge percentage)
- Execute trajectory (feedback: current joint positions)

### When to Use Each

**Use Topics when**:
- Data streams continuously (sensors, odometry)
- Low latency required
- Multiple subscribers need same data
- Fire-and-forget (no confirmation needed)

**Use Services when**:
- Need confirmation of completion
- Short operation (less than 1 second)
- Request-reply pattern fits naturally
- Configuration or status queries

**Use Actions when**:
- Operation takes more than 1 second
- Need progress feedback
- Cancellation required
- Long-running tasks (navigation, manipulation)

## Hands-On Lab

### Task 1: Create Service Server

Implement a service that adds two integers.

#### Step 1: Create Service Definition

For built-in services, use `example_interfaces/srv/AddTwoInts`:

```
int64 a
int64 b
---
int64 sum
```

#### Step 2: Implement Service Server

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

#### Step 3: Implement Service Client

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

#### Step 4: Build and Test

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

**Expected Output**:
```
# Server terminal:
[INFO] [add_two_ints_server]: Incoming request: a=5, b=7 -> sum=12

# Client terminal:
[INFO] [add_two_ints_client]: Result: 5 + 7 = 12
```

### Task 2: Create Action Server

Implement an action for Fibonacci sequence generation with feedback.

#### Step 1: Create Action Definition

Create `action/Fibonacci.action`:

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

#### Step 2: Implement Action Server

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

#### Step 3: Test Action

```bash
# Terminal 1: Start action server
ros2 run minimal_publisher fibonacci_action_server

# Terminal 2: Send action goal from command line
ros2 action send_goal /fibonacci minimal_publisher/action/Fibonacci "{order: 10}" --feedback
```

**Expected Output**:
```
# Server terminal:
[INFO] [fibonacci_action_server]: Feedback: [0, 1, 1]
[INFO] [fibonacci_action_server]: Feedback: [0, 1, 1, 2]
[INFO] [fibonacci_action_server]: Feedback: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
[INFO] [fibonacci_action_server]: Returning result: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

## Debugging with ros2cli

### Service Debugging

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

### Action Debugging

```bash
# List all actions
ros2 action list

# Get action info
ros2 action info /fibonacci

# Send action goal with feedback
ros2 action send_goal /fibonacci minimal_publisher/action/Fibonacci "{order: 5}" --feedback
```

## Common Errors & Fixes

### Error 1: "Service server not responding"

**Cause**: Service server node not running or name mismatch.

**Fix**:
```bash
# Verify server is running
ros2 node list

# Check service exists
ros2 service list

# Verify service name matches client
```

### Error 2: "Action goal rejected"

**Cause**: Server's `goal_callback` returned `GoalResponse.REJECT`.

**Fix**: Check server logs for rejection reason (invalid parameters, resource unavailable, etc.).

### Error 3: "Timeout waiting for service"

**Cause**: `wait_for_service()` timeout exceeded.

**Fix**: Increase timeout or ensure server starts before client.

### Error 4: "Future never completes"

**Cause**: `spin_until_future_complete()` never called or executor not spinning.

**Fix**: Always call `rclpy.spin_until_future_complete(node, future)` after `call_async()`.

## External Resources

- [ROS 2 Services Tutorial](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Services/Understanding-ROS2-Services.html)
- [ROS 2 Actions Tutorial](https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Actions/Understanding-ROS2-Actions.html)
- [Action Design Guide](https://design.ros2.org/articles/actions.html)
- [example_interfaces Package](https://github.com/ros2/example_interfaces)

## Assessment Questions

1. **What is the main difference between services and topics?**
   - A) Services are faster
   - B) Services are synchronous and block the client
   - C) Services use UDP instead of TCP
   - D) Services support multiple subscribers

   *Answer: B*

2. **When should you use an action instead of a service?**
   - A) When you need a response
   - B) When the operation takes more than 1 second and requires feedback
   - C) When you need high-frequency communication
   - D) When multiple clients are involved

   *Answer: B*

3. **What are the three components of an action definition?**
   - A) Request, Response, Feedback
   - B) Goal, Feedback, Result
   - C) Input, Output, Status
   - D) Start, Progress, End

   *Answer: B*

4. **Can a service server handle multiple clients simultaneously?**
   - A) No, only one client per server
   - B) Yes, but only with multi-threaded executors
   - C) Yes, requests are queued and processed sequentially
   - D) Only if clients use async calls

   *Answer: C (by default, single-threaded executor processes requests sequentially)*

5. **What happens if an action client cancels a goal mid-execution?**
   - A) Server immediately stops without cleanup
   - B) Server's `cancel_callback` is invoked, server can accept/reject cancellation
   - C) Goal continues to completion
   - D) ROS 2 throws an error

   *Answer: B*

6. **How does a service client know if the server exists before calling?**
   - A) Try calling and catch exceptions
   - B) Use `wait_for_service()` method
   - C) Check `ros2 service list` manually
   - D) Services always exist

   *Answer: B*

7. **Explain why navigation would use an action instead of a service.** (Short answer)

   *Expected answer: Navigation takes multiple seconds/minutes to complete, requires continuous feedback (distance remaining, current pose), and may need cancellation if the robot detects an obstacle or the user changes plans. Actions provide goal-feedback-result pattern with cancellation support, which services lack.*

8. **What does `rclpy.spin_until_future_complete()` do?**
   - A) Spins the robot motors
   - B) Blocks until the async service call completes or times out
   - C) Publishes to a topic
   - D) Creates a new thread

   *Answer: B*

9. **Can you create multiple service servers with the same service name?**
   - A) Yes, ROS 2 will load-balance requests
   - B) No, this causes a name collision error
   - C) Yes, but only in different namespaces
   - D) Only if they have different message types

   *Answer: C (with different namespaces, e.g., `/robot1/add_two_ints` and `/robot2/add_two_ints`)*

10. **Write the service definition for a service that takes a string and returns its length.** (Short answer)

    *Expected answer:*
    ```
    string input_string
    ---
    int32 length
    ```

## Further Reading

### Advanced Topics
- **Async Service Calls**: Non-blocking service clients with callbacks
- **Multi-Threaded Executors**: Parallel service/action processing
- **Namespaces and Remapping**: Manage multiple robots with same services
- **Service Discovery**: Dynamic service lookup and introspection

### Real-World Applications
- **MoveIt2**: Motion planning with action servers for trajectory execution
- **Nav2**: Navigation stack with action-based goal sending
- **Manipulation**: Grasp planning services, gripper control actions
- **Multi-Robot Systems**: Centralized services for fleet coordination

## Next Steps

**Congratulations!** You've completed Module 1: The Robotic Nervous System (ROS 2).

You now understand:
- ✅ ROS 2 architecture (nodes, DDS, middleware)
- ✅ Publisher-Subscriber pattern for asynchronous data streams
- ✅ Services for synchronous request-reply operations
- ✅ Actions for long-running tasks with feedback

**Continue to Module 2: Digital Twin (Gazebo & Unity)** to learn how to simulate and test your ROS 2 nodes in realistic physics-based environments before deploying to hardware.

<!-- PERSONALIZATION BUTTON -->
<!-- URDU TOGGLE -->
