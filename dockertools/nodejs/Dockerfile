from  ubuntu:18.04
# base image is 77.8MB for 22.04 - this wont work with older redhat hosts
# base image is 63.2MB for 18.04
# https://github.com/nodesource/distributions#ubuntu-versions
RUN apt-get update
# RUN apt-get --allow-unauthenticated upgrade
RUN apt-get install -y ca-certificates curl gnupg
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
# image grows to 138MB
ENV NODE_MAJOR="16"
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update
RUN apt-get install nodejs -y
# image grows to 237MB

# ~ is set to /root 
ENV HOME=/root;
WORKDIR $HOME/srv;
RUN npm init -f; npm install --save izy-proxy; mkdir -p node_modules/configs/izy-proxy;