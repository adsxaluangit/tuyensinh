FROM postgres:18-alpine

RUN apk add --no-cache dcron python3

COPY backup.sh /backup.sh
COPY restore.sh /restore.sh
COPY http-server.py /http-server.py
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /backup.sh /restore.sh /entrypoint.sh

EXPOSE 8080

VOLUME ["/backups"]

ENTRYPOINT ["/entrypoint.sh"]
