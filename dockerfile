# Etapa 1: build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia os arquivos do projeto
COPY package*.json ./
COPY . .

# Instala as dependências
RUN npm install

# Build do projeto
RUN npm run build

# Etapa 2: servidor Nginx para servir os arquivos
FROM nginx:stable-alpine

# Copia os arquivos de build para o diretório do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove a configuração default do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Adiciona uma nova configuração (simples, para SPA)
COPY nginx.conf /etc/nginx/conf.d

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
