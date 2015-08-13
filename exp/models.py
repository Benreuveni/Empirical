from django.db import models
from django.forms import ModelForm

import hashlib, time, random

class SessionManager(models.Manager):
    def create_session(self,name,configFile,expName):
        session = self.create(name=name,configFile=configFile,expName=expName)
        # add tokens
        session.sessionToken=hashlib.md5(session.name+session.expName+str(time.time())+("%08d" % random.randint(100000,999999))).hexdigest()[:16]
        session.receiptToken=hashlib.md5(session.name+session.expName+str(time.time())+("%08d" % random.randint(100000,999999))).hexdigest()[:16]
        session.save()
        return session

class Session(models.Model):
    sessionToken=models.CharField(max_length=100)
    receiptToken=models.CharField(max_length=100)
    name=models.CharField(max_length=100)
    expName=models.CharField(max_length=100)
    configFile=models.TextField()
    creationDate=models.DateTimeField(auto_now_add=True)

    objects=SessionManager()

    def __unicode__(self):
        return self.expName+':'+self.name

class Report(models.Model):
    sessionToken=models.CharField(max_length=100)
    sessionKey=models.ForeignKey('Session')
    eventType=models.CharField(max_length=100)
    uploadDate=models.DateTimeField(auto_now_add=True)
    dataLog=models.TextField()
    # app, ip other upload tracking information?

    def __unicode__(self):
        return self.sessionToken+'-'+self.eventType

class ReportForm(ModelForm):
    class Meta:
        model=Report
        fields=['sessionToken', 'eventType', 'dataLog']







