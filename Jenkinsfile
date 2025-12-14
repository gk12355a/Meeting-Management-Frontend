pipeline {
    agent any

    parameters {
        string(name: 'BUILD_TAG', defaultValue: 'v1.0.0', description: 'Version Tag (e.g., v1.0.0)')
        choice(name: 'TARGET_SERVICE', choices: ['meeting-management-frontend'], description: 'Service Name')
    }

    environment {
        // [CẬP NHẬT] Username Docker Hub
        DOCKER_REGISTRY_USER = "gk123a" 
        IMAGE_NAME = "meeting-management-frontend"
        
        // Cấu hình Git & Credentials
        GIT_REPO_URL = "https://github.com/gk12355a/meeting-management-frontend.git"
        GIT_CREDENTIALS_ID = "github-https-cred-ids" 
        DOCKER_CREDENTIALS_ID = "docker-hub-credentials"
        
        // Tự động xác định môi trường dựa trên nhánh (k8s -> prod, nhánh khác -> dev)
        BRANCH = "${env.GIT_BRANCH}".replaceFirst(/^origin\//, '')
        NAMESPACE = "${BRANCH == 'k8s' ? 'prod' : 'dev'}"
        
        // Đường dẫn
        FRONTEND_DIR = "."       // Dockerfile nằm ngay root
        YAML_DIR = "manifest"    // Folder chứa file k8s yaml
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
                    url: "${GIT_REPO_URL}"
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    dir("${FRONTEND_DIR}") {
                        // Login vào Docker Hub (để trống URL để dùng mặc định)
                        docker.withRegistry('', "${DOCKER_CREDENTIALS_ID}") {
                            
                            def fullImageName = "${DOCKER_REGISTRY_USER}/${IMAGE_NAME}:${params.BUILD_TAG}-${NAMESPACE}"
                            
                            echo "Building Docker Image: ${fullImageName}"
                            // Build từ Dockerfile tại thư mục hiện tại (.)
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
                    // Cấp quyền thực thi cho script
                    sh "chmod +x update_images_scripts.sh"
                    
                    // Chạy script update image trong file YAML
                    // Thứ tự tham số khớp với script: ImageName - Tag - Env - Dir
                    sh "./update_images_scripts.sh ${IMAGE_NAME} ${params.BUILD_TAG} ${NAMESPACE} ${YAML_DIR}"
                }
            }
        }

        stage('GitOps: Commit & Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${GIT_CREDENTIALS_ID}", usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                    sh """
                        # Cấu hình user commit ảo cho Jenkins
                        git config user.name "jenkins-bot"
                        git config user.email "jenkins@ci.com"
                        
                        # Cấu hình URL có chứa token/pass để push được code
                        git remote set-url origin https://${GIT_USER}:${GIT_PASS}@github.com/gk12355a/meeting-management-frontend.git
                        
                        # Chỉ add các file thay đổi trong thư mục manifest
                        git add ${YAML_DIR}/*.yaml
                        
                        # Commit với [ci skip] để tránh lặp pipeline
                        git commit -m "GitOps: Update Frontend image to ${params.BUILD_TAG} [ci skip]" || echo "No changes to commit"
                        
                        # Pull code mới nhất về trước khi push (tránh conflict)
                        git pull origin ${BRANCH} --rebase
                        
                        # Push lên GitHub
                        git push origin ${BRANCH}
                    """
                }
            }
        }
    }
}