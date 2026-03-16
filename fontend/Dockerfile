FROM node:22-alpine as build
WORKDIR /app
ARG VITE_STRAPI_URL
ENV VITE_STRAPI_URL=${VITE_STRAPI_URL}
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 82
CMD ["nginx", "-g", "daemon off;"]
