from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time

start = time.time()

options = webdriver.FirefoxOptions()
options.add_argument("--headless")
driver = webdriver.Firefox(options=options)
event = {
    'body': {   
        'username': '',   
        'password': ''
    }
}

driver.get("https://ecampus.psgtech.ac.in/studzone2/")
    
# Prepare Response
res = {
    'statusCode': 200,
    'headers': {
        'Content-Type': 'application/json'
    }
}

# Login Page
driver.find_element(By.XPATH, "/html/body/form/div[3]/div[1]/div[4]/div/div/ul/center/table/tbody/tr[1]/td[2]/input").send_keys(event['body']['username'])
driver.find_element(By.XPATH, "/html/body/form/div[3]/div[1]/div[4]/div/div/ul/center/table/tbody/tr[2]/td[2]/input").send_keys(event['body']['password'])
driver.find_element(By.XPATH, "/html/body/form/div[3]/div[1]/div[4]/div/div/ul/center/input").click()

# Validate Login Details
try:
    alert = WebDriverWait(driver, 0.1).until(EC.alert_is_present())
    alert_text = alert.text
    alert.accept()
    
    res['statusCode'] = 400
    res['body'] = {'message': alert_text}
    print(res)

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

    print(res)


end = time.time()
print(end - start)

driver.quit()
