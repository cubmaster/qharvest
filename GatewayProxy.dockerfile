FROM nginx:latest
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./fake_htpasswd /etc/nginx/htpasswd
