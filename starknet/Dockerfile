FROM debian

RUN apt update -y && apt install -y python3-pip libgmp3-dev && pip3 install starknet-devnet

CMD starknet-devnet --host 0.0.0.0

EXPOSE 5000
