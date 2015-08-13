__author__ = 'drlemur'

from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$',views.index,name='exp_index'),
    url(r'^start/(?P<sessionToken>[0-9a-z]+)', views.start, name='start_exp'),
    url(r'^report/(?P<sessionToken>[0-9a-z]+)', views.report, name='report_exp'),
    url(r'^experiment/(?P<sessionToken>[0-9a-z]+)', views.experiment, name='display_exp_info'),
    url(r'^tokens/(?P<sessionToken>[a-z0-9]+)', views.make_link_tokens, name='exp_tokens'),
    url(r'^config/(?P<sessionToken>[a-z0-9]+)', views.show_config, name='display_config'),
    url(r'^data/(?P<sessionToken>[0-9a-z]+)$', views.show_data, name='display_data'),
    url(r'^data/(?P<sessionToken>[0-9a-z]+)/(?P<pkid>[0-9]+)$', views.show_data, name='display_data'),
    url(r'^status/(?P<sessionToken>[0-9a-z]+)$', views.return_status, name='show_status'),
    url(R'^download/(?P<sessionToken>[0-9a-z]+)$', views.download_data, name='download'),
]
