FROM emscripten/emsdk:3.1.73

RUN apt update && apt-get install -y autotools-dev automake libtool pkg-config ragel
RUN git config --global --add safe.directory '*'
