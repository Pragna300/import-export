from logger import log

def test_logging():
    log.info("This is an info message from the test script")
    log.error("This is an error message from the test script")
    log.debug("This is a debug message (should go to file only or stdout if level set to DEBUG)")

if __name__ == "__main__":
    test_logging()
