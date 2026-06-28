import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Cấu hình encoding UTF-8 để hiển thị Tiếng Việt trên Windows console
sys.stdout.reconfigure(encoding='utf-8')

KEEP_BROWSER_OPEN = True

options = webdriver.ChromeOptions()
options.add_argument("--start-maximized")
options.add_experimental_option('excludeSwitches', ['enable-logging'])
options.add_experimental_option('detach', True)

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)


def wait_before_close(message):
    try:
        input(message)
    except EOFError:
        time.sleep(86400)

try:
    print("--- BẮT ĐẦU KIỂM THỬ LUỒNG CẬP NHẬT HỒ SƠ ---")
    
    # 1. Đăng nhập trước
    print("1. Đăng nhập hệ thống...")
    driver.get("http://localhost:5173/auth/login")
    
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[name='email']"))
    )
    
    driver.find_element(By.CSS_SELECTOR, "input[name='email']").send_keys("user3@itforum.local")
    driver.find_element(By.CSS_SELECTOR, "input[name='password']").send_keys("123456")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    
    WebDriverWait(driver, 10).until(
        lambda d: d.current_url.rstrip('/') == "http://localhost:5173" or "/home" in d.current_url
    )
    print("Đăng nhập thành công.")
    time.sleep(1)

    # 2. Truy cập trang cá nhân
    print("2. Chuyển sang trang cá nhân...")
    driver.get("http://localhost:5173/user/profile")
    time.sleep(2)

    # 3. Click nút "Chỉnh sửa hồ sơ"
    print("3. Click nút 'Chỉnh sửa hồ sơ'...")
    edit_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Chỉnh sửa hồ sơ')]"))
    )
    edit_btn.click()
    time.sleep(2)

    # 4. Nhập thông tin thay đổi
    print("4. Nhập thông tin cập nhật mới...")
    name_field = driver.find_element(By.CSS_SELECTOR, "input[name='fullName']")
    name_field.clear()
    name_field.send_keys("Phan Việt Tuấn")
    
    phone_field = driver.find_element(By.CSS_SELECTOR, "input[name='phone']")
    phone_field.clear()
    phone_field.send_keys("0912345678")
    
    major_field = driver.find_element(By.CSS_SELECTOR, "input[name='major']")
    major_field.clear()
    major_field.send_keys("An toàn thông tin")
    
    bio_field = driver.find_element(By.CSS_SELECTOR, "textarea[name='bio']")
    bio_field.clear()
    bio_field.send_keys("Chào mọi người, mình là Thành viên 3. Đây là phần mô tả được cập nhật tự động bằng kịch bản Selenium!")
    
    time.sleep(2)

    # 5. Click nút "Lưu thay đổi"
    print("5. Click nút 'Lưu thay đổi'...")
    save_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    save_button.click()

    # 6. Chờ thông báo Toast cập nhật thành công
    print("6. Đợi Toast thông báo thành công từ hệ thống...")
    toast_element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'thành công') or contains(text(), 'Cập nhật')]"))
    )
    print(f"Kết quả Toast: '{toast_element.text}'")
    
    time.sleep(3)
    print("--- CẬP NHẬT HỒ SƠ THÀNH CÔNG ---")

except Exception as e:
    print(f"LỖI: Quá trình cập nhật hồ sơ thất bại. Chi tiết lỗi: {e}")

finally:
    if KEEP_BROWSER_OPEN:
        print("Đã chạy xong. Trình duyệt sẽ được giữ mở.")
        wait_before_close("Nhấn Enter để đóng trình duyệt...")
        driver.quit()
    else:
        driver.quit()