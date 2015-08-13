__author__ = 'drlemur'

from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$',views.index,name='uploader_index'),
    url(r'^report/(?P<zip_file_id>[0-9]+)/$',views.unpack,name='uploader_unpack'),
]

