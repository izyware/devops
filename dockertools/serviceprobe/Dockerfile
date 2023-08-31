# Build
#   docker build dockertools/serviceprobe -t dockertools/serviceprobe;
# Run
#   docker run -e CMD_TO_RUN="ls -l" dockertools/serviceprobe;
# To poke around inside the container
#   docker run -it --entrypoint sh dockertools/serviceprobe -c bash
#   > ping host.docker.internal
#   > mysql --host=host.docker.internal --user=root --password=password -e "show variables;"
# CMD_TO_RUN values for mimicking services:
#   # echo tcp service on port 9000:
#   /usr/bin/ncat -vvvv -e /bin/cat -k -l 9000
#   # mysql on 3306
#   nc -vz 127.0.0.1 3306
# CMD_TO_RUN values for probing and service discovery
#   # mysql on localhost
#   /usr/bin/nc -vz localhost 3306
FROM ubuntu:20.04
ENV CONTAINER_CONTEXT="Service Probe"
ENV SLEEP_SECONDS=5
ENV CMD_TO_RUN="/usr/bin/nc -vz localhost 3306"
RUN apt -y update;apt-get -y install netcat ncat mysql-client net-tools iputils-ping vim;
COPY ./entrypoint.sh /tmp
RUN chmod +x /tmp/entrypoint.sh
ENTRYPOINT ["/tmp/entrypoint.sh"]