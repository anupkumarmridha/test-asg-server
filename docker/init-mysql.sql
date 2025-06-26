-- Database initialization script for test-asg-server MySQL
-- This script will be executed when the MySQL container starts

-- Use the database
USE test_asg_db;

-- Create a simple health check function
DELIMITER //
CREATE FUNCTION health_check()
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE result JSON;
    SET result = JSON_OBJECT(
        'status', 'healthy',
        'timestamp', NOW(),
        'version', VERSION()
    );
    RETURN result;
END //
DELIMITER ;

-- Create a simple log for initialization
CREATE TABLE IF NOT EXISTS initialization_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO initialization_log (message) 
VALUES ('Database initialized successfully for test-asg-server MySQL');

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON test_asg_db.* TO 'mysql_user'@'%';
FLUSH PRIVILEGES;
