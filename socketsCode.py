import asyncio
import schedule
import threading
import time
import websockets
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import json

# Define a flag to indicate whether scraping is in progress
scraping_in_progress = False

# Define a list to store WebSocket clients
clients = set()
users = {}

async def notify_clients(data):
    for client in clients:
        await client.send(data)

async def websocket_handler(websocket, path):
    global clients
    global users
    clients.add(websocket)
    print(f"New WebSocket client connected from {websocket.remote_address}")

    try:
        while True:
            data = await websocket.recv()
            print(f"Received from {websocket.remote_address}: {data}")
            splitData = data.split('\n')
            scrape_data(splitData[0], splitData[1])

    except websockets.exceptions.ConnectionClosed:
        print(f"WebSocket client {websocket.remote_address} disconnected")
        clients.remove(websocket)

def scrape_data(username, password):
    print("Scraping data...")
    global scraping_in_progress
    global users

    if scraping_in_progress:
        return

    try:
        start = time.time()

        options = webdriver.FirefoxOptions()
        options.add_argument("--headless")
        driver = webdriver.Firefox(options=options)

        # Prepare Response
        res = {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            }
        }

        driver.get("https://ecampus.psgtech.ac.in/studzone2/")

        # Login Page
        driver.find_element(By.XPATH, "/html/body/form/div[3]/div[1]/div[4]/div/div/ul/center/table/tbody/tr[1]/td[2]/input").send_keys(username)
        driver.find_element(By.XPATH, "/html/body/form/div[3]/div[1]/div[4]/div/div/ul/center/table/tbody/tr[2]/td[2]/input").send_keys(password)
        driver.find_element(By.XPATH, "/html/body/form/div[3]/div[1]/div[4]/div/div/ul/center/input").click()

        # Validate Login Details
        try:
            alert = WebDriverWait(driver, 0.1).until(EC.alert_is_present())
            alert_text = alert.text
            alert.accept()
            
            res['statusCode'] = 400
            res['body'] = {'message': alert_text}

        except TimeoutException:
            studentName = driver.find_element(By.XPATH, "/html/body/form/table[1]/tbody/tr[2]/td[2]/span").text
            
            # Retrieve Attendance
            driver.find_element(By.XPATH, "/html/body/form/table[1]/tbody/tr[3]/td/table[7]/tbody/tr/td[3]").click()
            driver.find_element(By.XPATH, "/html/body/form/table[1]/tbody/tr[3]/td/table[2]/tbody/tr[6]/td").click()
            
            table = driver.find_element(By.XPATH, "/html/body/form/center/table/tbody/tr/td/table/tbody")
            tableData = list(map(lambda row: list(map(lambda cell: cell.text, row.find_elements(By.TAG_NAME, "td"))), table.find_elements(By.TAG_NAME, "tr")[1:]))
                
            # Retrieve Course Details
            driver.find_element(By.XPATH, "/html/body/form/table[1]/tbody/tr[3]/td/table[7]/tbody/tr/td[3]").click()
            driver.find_element(By.XPATH, "/html/body/form/table[1]/tbody/tr[3]/td/table[2]/tbody/tr[7]/td").click()
            
            courses = driver.find_element(By.XPATH, "/html/body/form/table[3]/tbody/tr/td/table/tbody")
            coursesData = list(map(lambda row: list(map(lambda cell: cell.text, row.find_elements(By.TAG_NAME, "td"))), courses.find_elements(By.TAG_NAME, "tr")[1:]))
            
            # Retrieve Sem Results
            driver.find_element(By.XPATH, "/html/body/form/table[1]/tbody/tr[3]/td/table[7]/tbody/tr/td[5]").click()
            driver.find_element(By.XPATH, "/html/body/form/table[1]/tbody/tr[3]/td/table[4]/tbody/tr[5]/td").click()
            
            results = driver.find_element(By.XPATH, "/html/body/form/table[7]/tbody/tr[1]/td[1]/table/tbody")
            resultsData = list(map(lambda row: list(map(lambda cell: cell.text, row.find_elements(By.TAG_NAME, "td"))), results.find_elements(By.TAG_NAME, "tr")[1:]))

            res['body'] = {
                'studentName': studentName,
                'attendance': tableData,
                'courses': coursesData,
                'results': resultsData,
            }

        end = time.time()
        driver.quit()

        response_data = {
            'statusCode': res['statusCode'],
            'student_data': res['body'],
            'elapsed_time': end - start
        }

        print(response_data)
        scraping_in_progress = False

        if response_data['statusCode'] == 200:
            users[username] = password
            schedule.every(10).seconds.do(scrape_data, username, password)
            print(users)
        asyncio.run(notify_clients(json.dumps(response_data)))

    except Exception as e:
        scraping_in_progress = False

if __name__ == '__main__':
    # Start the WebSocket server in a separate thread
    def start_websocket_server():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(websockets.serve(websocket_handler, "localhost", 8888))
        loop.run_forever()

    websocket_thread = threading.Thread(target=start_websocket_server)
    websocket_thread.start()

    print(f"WebSocket server is running on ws://localhost:8888")

    # Start the scheduler in the main thread
    # schedule.every(10).seconds.do(scrape_data)

    while True:
        schedule.run_pending()
        time.sleep(1)
