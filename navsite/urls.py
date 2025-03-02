from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from ninja import NinjaAPI
from navigation.api import router as navigation_router
from navigation.views import download_file

# 设置管理后台标题
admin.site.site_header = "医院内网导航站管理后台"
admin.site.site_title = "医院内网导航站"
admin.site.index_title = "管理首页"

api = NinjaAPI()
api.add_router("/navigation/", navigation_router)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
    path('', TemplateView.as_view(template_name='navigation/index.html'), name='home'),
    # 添加文件下载路由，使用正则表达式匹配任何路径
    re_path(r'^downloads/(?P<file_path>.+)$', download_file, name='download_file'),
]

# 在开发环境中提供媒体文件服务
if settings.DEBUG:
    # 静态文件
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    # 媒体文件
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    # 注释掉这部分
    # import debug_toolbar
    # urlpatterns = [
    #     path('__debug__/', include(debug_toolbar.urls)),
    # ] + urlpatterns

