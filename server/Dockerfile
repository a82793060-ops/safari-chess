# صورة Docker لخادم وساطة بيدق — قابلة للنشر على Koyeb / Fly / أي منصّة.
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=8000
EXPOSE 8000
CMD ["npm", "start"]
