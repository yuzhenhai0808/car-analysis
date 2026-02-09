# 使用轻量级的 nginx 镜像来托管静态网站
FROM nginx:alpine

# 复制静态文件到 nginx 默认目录
COPY index.html /usr/share/nginx/html/

# 可选：自定义 nginx 配置（启用 gzip 压缩等）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# nginx 默认会在前台运行
CMD ["nginx", "-g", "daemon off;"]
