#!/bin/bash
# Mission Control - Deployment Test Suite

echo "🧪 Mission Control - Deployment Tests"
echo "======================================"
echo ""

FAIL=0
PASS=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo "  ✅ $2"
        PASS=$((PASS + 1))
    else
        echo "  ❌ $2"
        FAIL=$((FAIL + 1))
    fi
}

# Test 1: Server is running
echo "1. Server Process"
if [ -f ../backend/staging.pid ] && ps -p $(cat ../backend/staging.pid) > /dev/null 2>&1; then
    test_result 0 "Server process running"
else
    test_result 1 "Server process not running"
fi

# Test 2: Port is listening
echo ""
echo "2. Network"
if ss -tuln | grep -q ":8080"; then
    test_result 0 "Port 8080 is listening"
else
    test_result 1 "Port 8080 not listening"
fi

# Test 3: Health endpoint
echo ""
echo "3. Health Endpoint"
HEALTH=$(curl -s -m 5 http://localhost:8080/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    test_result 0 "Health endpoint responding"
else
    test_result 1 "Health endpoint not responding"
fi

# Test 4: Frontend loads
echo ""
echo "4. Frontend"
FRONTEND=$(curl -s -m 5 http://localhost:8080)
if echo "$FRONTEND" | grep -q "Mission Control"; then
    test_result 0 "Frontend loads"
else
    test_result 1 "Frontend not loading"
fi

# Test 5: API responds
echo ""
echo "5. API"
API=$(curl -s -m 5 http://localhost:8080/api/auth/login -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' 2>&1)
if echo "$API" | grep -q "success"; then
    test_result 0 "API responding"
else
    test_result 1 "API not responding"
fi

# Summary
echo ""
echo "======================================"
echo "Results: $PASS passed, $FAIL failed"
echo "======================================"

if [ $FAIL -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi
