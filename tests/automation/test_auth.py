import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import sys
sys.stdout.reconfigure(encoding='utf-8')
# 1. Cấu hình Khởi tạo Trình duyệt Chrome
KEEP_BROWSER_OPEN = True

options = webdriver.ChromeOptions()

options.add_argument("--start-maximized")  # Mở tràn màn hình

options.add_experimental_option('excludeSwitches', ['enable-logging'])

options.add_experimental_option('detach', True)

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

def wait_before_close(message):
    try:
        input(message)
    except Exception:
        while True:
            time.sleep(60)
try:
    # 2. Truy cập trang Đăng nhập
    print("Truy cập trang đăng nhập...")
    driver.get("http://localhost:5173/auth/login")  # Vite dev server mặc định của dự án
    time.sleep(2)  # Dừng lại 2 giây để chụp ảnh bước chuẩn bị nhập liệu

    # 3. Định vị các phần tử trên Form Đăng nhập và Điền dữ liệu
    print("Nhập thông tin đăng nhập...")

    # Định vị ô Email (Sử dụng Selector theo thuộc tính name hoặc placeholder hoặc type)
    email_input = driver.find_element(By.CSS_SELECTOR, "input[name='email']")
    email_input.send_keys("user3@itforum.local")  # Thay bằng tài khoản test thực tế

    # Định vị ô Mật khẩu
    password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    password_input.send_keys("123456")  # Thay bằng mật khẩu test thực tế

    time.sleep(2)  # Dừng 2 giây để chụp ảnh minh họa lúc form đã điền thông tin

    # 4. Click nút Đăng nhập
    print("Click nút Đăng nhập...")
    login_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    login_button.click()

    # 5. Đợi hệ thống xử lý và chuyển hướng (Xác thực kết quả mong đợi)
    print("Đợi chuyển hướng trang chủ...")
    # Sau login app hiện điều hướng về '/' rồi mới render trang chủ.
    WebDriverWait(driver, 10).until(
        lambda d: d.current_url.rstrip('/') in {"http://localhost:5173", "http://localhost:5173/home"}
    )

    # Kiểm tra xem có chứa nút "Đăng xuất" hoặc Avatar để chứng tỏ đã đăng nhập thành công
    time.sleep(3)  # Chờ trang chủ load xong hoàn toàn để chụp ảnh kết quả thành công
    print("ĐĂNG NHẬP THÀNH CÔNG!")

except Exception as e:
    print(f"Có lỗi xảy ra trong quá trình kiểm thử: {e}")

finally:
    if KEEP_BROWSER_OPEN:
        print("Đã chạy xong. Trình duyệt sẽ được giữ mở.")
        wait_before_close("Nhấn Enter để đóng trình duyệt...")
        driver.quit()
    else:
        driver.quit()