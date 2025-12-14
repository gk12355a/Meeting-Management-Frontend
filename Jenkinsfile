pipeline {
    agent any

    parameters {
        string(name: 'BUILD_TAG', defaultValue: 'v1.0.0', description: 'Version Tag (e.g., v1.0.0)')
        choice(name: 'TARGET_SERVICE', choices: ['meeting-management-frontend'], description: 'Service Name')
    }

    environment {
        // --- CẤU HÌNH DOCKER ---
        DOCKER_REGISTRY_USER = "gk123a"
        IMAGE_NAME = "meeting-management-frontend"
        DOCKER_CREDENTIALS_ID = "docker-hub-credentials"
        
        // --- CẤU HÌNH GIT ---
        // Lưu URL không có https:// để dễ ghép chuỗi bảo mật sau này
        GIT_REPO_RAW_URL = "github.com/gk12355a/meeting-management-frontend.git"
        GIT_REPO_FULL_URL = "https://github.com/gk12355a/meeting-management-frontend.git"
        GIT_CREDENTIALS_ID = "github-https-cred-ids" 
        
        // --- CẤU HÌNH MÔI TRƯỜNG ---
        // Tự động xác định namespace: k8s -> prod, nhánh khác -> dev
        BRANCH = "${env.GIT_BRANCH}".replaceFirst(/^origin\//, '')
        NAMESPACE = "${BRANCH == 'k8s' ? 'prod' : 'dev'}"
        
        // --- ĐƯỜNG DẪN ---
        FRONTEND_DIR = "."       
        YAML_DIR = "manifest"    
    }

    stages {
        stage('Approval') {
            steps {
                script {
                    input message: "Deploy Frontend ${params.BUILD_TAG} to [${NAMESPACE}]?", ok: "Yes, Deploy"
                }
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: "${BRANCH}", 
                    credentialsId: "${GIT_CREDENTIALS_ID}", 
                    url: "${GIT_REPO_FULL_URL}"
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    dir("${FRONTEND_DIR}") {
                        docker.withRegistry('', "${DOCKER_CREDENTIALS_ID}") {
                            def fullImageName = "${DOCKER_REGISTRY_USER}/${IMAGE_NAME}:${params.BUILD_TAG}-${NAMESPACE}"
                            
                            echo "Building Docker Image: ${fullImageName}"
                            def image = docker.build(fullImageName, ".")
                            
                            echo "Pushing image to Docker Hub..."
                            image.push()
                            image.push("latest") 
                        }
                    }
                }
            }
        }

        stage('GitOps: Update Manifest') {
            steps {
                script {
                    // Cấp quyền thực thi và chạy script sửa file YAML
                    sh "chmod +x update_images_scripts.sh"
                    sh "./update_images_scripts.sh ${IMAGE_NAME} ${params.BUILD_TAG} ${NAMESPACE} ${YAML_DIR}"
                }
            }
        }

        stage('GitOps: Commit & Push') {
            // [QUAN TRỌNG] Chuyển biến Groovy sang biến Shell Environment để an toàn và tránh lỗi cú pháp
            environment {
                TARGET_BRANCH = "${BRANCH}"
                TARGET_YAML_DIR = "${YAML_DIR}"
                NEW_TAG = "${params.BUILD_TAG}"
            }
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: "${GIT_CREDENTIALS_ID}", 
                        usernameVariable: 'GIT_USER', 
                        passwordVariable: 'GIT_PASS'
                    )
                ]) {
                    // Sử dụng 3 dấu nháy đơn (''') để ngăn Jenkins in biến mật khẩu ra log
                    sh '''
                        set -e

                        echo "--- 1. Cấu hình Git User ---"
                        git config user.name "jenkins-bot"
                        git config user.email "jenkins@ci.com"

                        echo "--- 2. Staging Files ---"
                        # Chỉ add các file YAML trong thư mục manifest
                        git add $TARGET_YAML_DIR/*.yaml

                        echo "--- 3. Committing ---"
                        # Kiểm tra xem có thay đổi nào để commit không
                        if ! git diff-index --quiet HEAD; then
                            git commit -m "GitOps: Update Frontend image to $NEW_TAG [ci skip]"
                            echo "Changes committed successfully."
                        else
                            echo "No changes in manifest to commit."
                        fi

                        echo "--- 4. Cleaning Workspace (Fix Rebase Error) ---"
                        # Đây là bước quan trọng sửa lỗi "Unstaged changes" của bạn:
                        # Reset các file tracked bị sửa đổi (ví dụ: script bị chmod +x ở stage trước)
                        git reset --hard HEAD
                        # Xóa sạch các file untracked (rác, file build tạm)
                        git clean -fd

                        echo "--- 5. Pulling & Rebasing ---"
                        # Lúc này workspace đã sạch, rebase sẽ thành công
                        git pull origin $TARGET_BRANCH --rebase

                        echo "--- 6. Pushing ---"
                        # Truyền password trực tiếp vào lệnh push (an toàn hơn set-url config)
                        git push https://$GIT_USER:$GIT_PASS@$GIT_REPO_RAW_URL $TARGET_BRANCH
                    '''
                }
            }
        }
    }
}