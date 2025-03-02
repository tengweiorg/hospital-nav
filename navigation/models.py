from django.db import models
from pypinyin import lazy_pinyin, Style

class Category(models.Model):
    name = models.CharField("类别名称", max_length=50)
    icon = models.CharField("图标", max_length=50, blank=True)
    order = models.IntegerField("排序", default=0)
    is_active = models.BooleanField("是否启用", default=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    updated_at = models.DateTimeField("更新时间", auto_now=True)
    
    class Meta:
        ordering = ['order', 'id']
        verbose_name = "网站类别"
        verbose_name_plural = verbose_name
    
    def __str__(self):
        return self.name

class Website(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="websites", verbose_name="所属类别")
    name = models.CharField("网站名称", max_length=100)
    name_pinyin = models.CharField("拼音", max_length=200, blank=True)
    url = models.CharField("网站地址", max_length=255)
    icon = models.CharField("图标", max_length=50, blank=True)
    description = models.TextField("描述", blank=True)
    description_pinyin = models.CharField("描述拼音", max_length=500, blank=True)
    order = models.IntegerField("排序", default=0)
    is_active = models.BooleanField("是否启用", default=True)
    clicks = models.IntegerField("点击次数", default=0)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    updated_at = models.DateTimeField("更新时间", auto_now=True)
    is_download = models.BooleanField("是否为下载链接", default=False)
    download_path = models.CharField("下载路径", max_length=255, blank=True)
    
    def save(self, *args, **kwargs):
        self.name_pinyin = ''.join(lazy_pinyin(self.name, style=Style.NORMAL))
        if self.description:
            self.description_pinyin = ''.join(lazy_pinyin(self.description, style=Style.NORMAL))
        super().save(*args, **kwargs)
    
    def get_url(self):
        if self.is_download and self.download_path:
            return f"/downloads/{self.download_path}"
        return self.url
    
    def get_absolute_url(self):
        return self.get_url()
    
    class Meta:
        ordering = ['order', 'id']
        verbose_name = "网站"
        verbose_name_plural = verbose_name
    
    def __str__(self):
        return self.name

class Shortcut(models.Model):
    SHORTCUT_TYPE_CHOICES = [
        ('favorite', '常用应用'),
        ('recent', '最近添加'),
    ]
    
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name="shortcuts", verbose_name="关联网站")
    type = models.CharField("快捷方式类型", max_length=20, choices=SHORTCUT_TYPE_CHOICES)
    order = models.IntegerField("排序", default=0)
    is_active = models.BooleanField("是否启用", default=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    updated_at = models.DateTimeField("更新时间", auto_now=True)
    
    class Meta:
        ordering = ['type', 'order', '-created_at']
        verbose_name = "快捷方式"
        verbose_name_plural = verbose_name
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.website.name}"