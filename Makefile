include .env

edit-supervisor:
	vi /etc/supervisor/conf.d/transcribeanyaudio.conf

first-install-server:
	apt update
	apt upgrade
	apt install build-essential

install-whisper.cpp:
	rm -Rf whisper.cpp/
	git clone https://github.com/ggerganov/whisper.cpp
	cd whisper.cpp && bash ./models/download-ggml-model.sh medium
	cd whisper.cpp && make

run-remotely:
	rm -Rf node-v20.9.0-linux-arm64.tar.xz
	rm -Rf node-v20.9.0-linux-arm64
	wget https://nodejs.org/dist/v20.9.0/node-v20.9.0-linux-arm64.tar.xz
	tar -xJvf node-v20.9.0-linux-arm64.tar.xz
	rm -Rf node-v20.9.0-linux-arm64.tar.xz
	chmod +x ./node-v20.9.0-linux-arm64/bin/node
	./node-v20.9.0-linux-arm64/bin/node ./dist/app.js

install:
	npm i

ssh:
	sshpass -p ${SERVER_PASSWORD} ssh -o StrictHostKeyChecking=no ${SERVER_USERNAME}@${SERVER_IP}

start:
	npm run watch

deploy: build
	rsync -ratlz --rsh="sshpass -p ${SERVER_PASSWORD} ssh -o StrictHostKeyChecking=no -l gabriel" ./dist  ${SERVER_IP}:/home/gabriel/transcribeanyaudio
	rsync -ratlz --rsh="sshpass -p ${SERVER_PASSWORD} ssh -o StrictHostKeyChecking=no -l gabriel" ./node_modules  ${SERVER_IP}:/home/gabriel/transcribeanyaudio
	rsync -ratlz --rsh="sshpass -p ${SERVER_PASSWORD} ssh -o StrictHostKeyChecking=no -l gabriel" ./assets  ${SERVER_IP}:/home/gabriel/transcribeanyaudio
	rsync -ratlz --rsh="sshpass -p ${SERVER_PASSWORD} ssh -o StrictHostKeyChecking=no -l gabriel" ./public  ${SERVER_IP}:/home/gabriel/transcribeanyaudio
	rsync -ratlz --rsh="sshpass -p ${SERVER_PASSWORD} ssh -o StrictHostKeyChecking=no -l gabriel" Makefile  ${SERVER_IP}:/home/gabriel/transcribeanyaudio

build:
	npm run build