FROM emscripten/emsdk:3.1.10

RUN apt update
RUN apt-get install -y autotools-dev automake libtool pkg-config
RUN git config --global --add safe.directory '*'
