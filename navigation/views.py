from django.shortcuts import render
from django.http import FileResponse, Http404
from django.conf import settings
import os
import mimetypes
from pathlib import Path

# Create your views here.

def download_file(request, file_path):
    """处理文件下载请求"""
    # 安全检查：确保文件路径不包含 '..' 以防止目录遍历
    if '..' in file_path:
        raise Http404("无效的文件路径")
    
    # 使用Path对象安全地拼接路径
    safe_path = Path(settings.MEDIA_ROOT) / 'downloads' / file_path
    
    # 规范化路径并检查是否仍在允许的目录内
    safe_path = safe_path.resolve()
    download_root = Path(settings.MEDIA_ROOT) / 'downloads'
    if not safe_path.exists() or not safe_path.is_file() or not str(safe_path).startswith(str(download_root)):
        raise Http404("文件不存在或路径无效")
    
    # 获取文件名和MIME类型
    file_name = safe_path.name
    content_type, encoding = mimetypes.guess_type(str(safe_path))
    if content_type is None:
        content_type = 'application/octet-stream'
    
    # 重要：不要使用with语句，让FileResponse负责关闭文件
    file_obj = open(safe_path, 'rb')
    response = FileResponse(file_obj, content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename="{file_name}"'
    return response
