#!/bin/bash
# =============================================================
#  SCRIPT DE DESPLIEGUE - servidorUbuntu (192.168.100.3)
#  Docker Swarm Manager + Backend
# =============================================================

echo "======================================"
echo " Paso 1: Iniciar Docker Swarm"
echo "======================================"
docker swarm init --advertise-addr 192.168.100.3

echo ""
echo "======================================"
echo " Paso 2: Login en Docker Hub"
echo "======================================"
docker login -u dfgl17

echo ""
echo "======================================"
echo " Paso 3: Build y Push de imágenes"
echo "======================================"
cd /vagrant/barberia-docker

docker build -t dfgl17/barberia-clientes:latest ./Clientes
docker build -t dfgl17/barberia-servicios:latest ./servicios
docker build -t dfgl17/barberia-citas:latest ./citas
docker build -t dfgl17/barberia-frontend:latest ./frontend

docker push dfgl17/barberia-clientes:latest
docker push dfgl17/barberia-servicios:latest
docker push dfgl17/barberia-citas:latest
docker push dfgl17/barberia-frontend:latest

echo ""
echo "======================================"
echo " Paso 4: Desplegar el stack"
echo "======================================"
docker stack deploy -c docker-compose.yml barberia

echo ""
echo "✅ Stack desplegado. Verifica con:"
echo "   docker stack services barberia"
echo "   docker service ls"
