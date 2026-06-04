FROM postgres:18-alpine

RUN apk add --no-cache dcron netcat-openbsd

COPY backup.sh /backup.sh
COPY restore.sh /restore.sh
COPY http-trigger.sh /http-trigger.sh
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /backup.sh /restore.sh /http-trigger.sh /entrypoint.sh

EXPOSE 8080

VOLUME ["/backups"]

ENTRYPOINT ["/entrypoint.sh"]
