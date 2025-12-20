# Use official NGINX image
FROM nginx:alpine

# Remove default NGINX config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom NGINX config
COPY ../nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy React build output to NGINX html directory
COPY dist/ /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
