from datetime import datetime
from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from django.db.models import Q, Prefetch
from .models import Category, Website, Shortcut
from .schemas import CategorySchema, WebsiteSchema, CategoryWithWebsitesSchema, SearchResultSchema
from django.db import models

router = Router()

@router.get("/categories", response=List[CategorySchema])
def list_categories(request):
    return Category.objects.filter(is_active=True)

@router.get("/websites", response=List[WebsiteSchema])
def list_websites(request):
    """获取所有启用的网站列表"""
    return Website.objects.filter(is_active=True).select_related('category')

@router.get("/navigation", response=List[CategoryWithWebsitesSchema])
def get_navigation(request):
    # 使用prefetch_related减少数据库查询
    categories = Category.objects.filter(is_active=True).prefetch_related(
        Prefetch(
            'websites',
            queryset=Website.objects.filter(is_active=True).order_by('order', 'id')
        )
    )
    
    return [
        CategoryWithWebsitesSchema(
            id=category.id,
            name=category.name,
            icon=category.icon,
            order=category.order,
            websites=list(category.websites.all())
        )
        for category in categories
    ]

@router.get("/search", response=List[SearchResultSchema])
def search_websites(request, q: str):
    query = q.strip()
    if not query:
        return []
    
    return [
        SearchResultSchema(
            id=w.id, name=w.name, url=w.url, category_name=w.category.name
        )
        for w in Website.objects.filter(
            Q(name__icontains=query) |  # 原有的中文搜索
            Q(description__icontains=query) |  # 原有的描述搜索
            Q(name_pinyin__icontains=query) |  # 拼音搜索
            Q(description_pinyin__icontains=query),  # 描述拼音搜索
            is_active=True
        ).select_related('category')
    ]

@router.post("/log-click/{website_id}")
def log_click(request, website_id: int):
    website = get_object_or_404(Website, id=website_id)
    website.clicks += 1
    website.save()
    return {"success": True}

@router.get("/visitor-info")
def get_visitor_info(request):
    """获取访问者信息，包括IP地址"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    ip = x_forwarded_for.split(',')[0].strip() if x_forwarded_for else request.META.get('REMOTE_ADDR')
    
    return {
        "ip": ip,
        "user_agent": request.META.get('HTTP_USER_AGENT', ''),
        "timestamp": datetime.now().isoformat()
    }

@router.get("/shortcuts", response=List[WebsiteSchema])
def get_shortcuts(request, type: str = None):
    """获取快捷方式列表"""
    query = Shortcut.objects.filter(is_active=True)
    
    if type:
        query = query.filter(type=type)
    
    shortcuts = query.select_related('website')[:5]
    
    return [shortcut.website for shortcut in shortcuts]

@router.get("/popular-websites", response=List[WebsiteSchema])
def get_popular_websites(request, limit: int = 5):
    """获取点击量最高的网站"""
    return Website.objects.filter(is_active=True).order_by('-clicks')[:limit]