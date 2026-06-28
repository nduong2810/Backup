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

TEST_EMAIL = 'user3@itforum.local'
TEST_PASSWORD = '123456'
QUESTION_POST_URL = 'http://localhost:5173/posts/6a364719a1b07db4bbeff7f6'
EXPECTED_AUTHOR_NAME = 'Bùi Thị Kim'

options = webdriver.ChromeOptions()
options.add_argument('--start-maximized')
options.add_experimental_option('excludeSwitches', ['enable-logging'])

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)


def wait_before_close(message):
    try:
        input(message)
    except Exception:
        while True:
            time.sleep(60)


try:
    print('--- BẮT ĐẦU KIỂM THỬ UPVOTE BÀI CÂU HỎI ---')

    # Xóa session cũ để tránh dính tài khoản đã đăng nhập từ lần chạy trước.
    driver.delete_all_cookies()
    driver.get('http://localhost:5173')
    driver.execute_script('window.localStorage.clear(); window.sessionStorage.clear();')

    # 1. Đăng nhập bằng thành viên có reputation >= 15
    print('1. Đăng nhập hệ thống...')
    driver.get('http://localhost:5173/auth/login')

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[name='email']"))
    )

    driver.find_element(By.CSS_SELECTOR, "input[name='email']").send_keys(TEST_EMAIL)
    driver.find_element(By.CSS_SELECTOR, "input[name='password']").send_keys(TEST_PASSWORD)
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    WebDriverWait(driver, 10).until(
        lambda d: d.current_url.rstrip('/') in {'http://localhost:5173', 'http://localhost:5173/home'}
    )
    print('Đăng nhập thành công.')

    # 2. Mở một bài viết dạng câu hỏi đã seed sẵn
    print('2. Mở bài câu hỏi mục tiêu...')
    driver.get(QUESTION_POST_URL)

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, f"//*[contains(., '{EXPECTED_AUTHOR_NAME}')]"))
    )

    # 3. Bấm Upvote
    print('3. Thực hiện Upvote...')
    
    upvote_button = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "(//button[@title='Bình chọn lên'])[1]"))
    )

    # Cuộn màn hình tới vị trí của nút (đặt nút ở giữa màn hình)
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", upvote_button)
    time.sleep(1) # Chờ 1 giây để hiệu ứng cuộn hoàn tất

    driver.execute_script("arguments[0].click();", upvote_button)

    # 4. Chờ UI đổi trạng thái sang upvote
    WebDriverWait(driver, 10).until(
        lambda d: 'border-primary' in d.find_element(By.XPATH, "(//button[@title='Bình chọn lên'])[1]").get_attribute('class')
    )

    print('ĐĂNG UPVOTE THÀNH CÔNG!')
    time.sleep(3)

except Exception as e:
    print(f'LỖI: Kiểm thử upvote thất bại. Chi tiết lỗi: {e}')

finally:
    if KEEP_BROWSER_OPEN:
        print('Đã chạy xong. Trình duyệt sẽ được giữ mở.')
        wait_before_close('Nhấn Enter để đóng trình duyệt...')
        driver.quit()
    else:
        driver.quit()
