from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.

from exp.models import Session, Report, ReportForm

# Experiments as a structure don't exist in the db, each session has it's own line
#  so experiment information is assembled on the fly from what is in the db
class Experiment_desc():
    def __init__(self,name,fill=True):
        self.name=name
        if fill:
            self.find_sessions()

    def find_sessions(self):
        session_list=Session.objects.all().filter(expName=self.name)
        if session_list!=[]:
            self.date=session_list[0].creationDate # experiment creation date is assumed to be the same for all config files
            self.token=session_list[0].sessionToken # this sessionToken can be used as a link to the experiment display view
            cfg_list=[]
            for s in session_list:
                # check for data reports on this session
                report_list=Report.objects.all().filter(sessionToken=s.sessionToken)
                reports=[]
                for i in report_list:
                    r = (i.eventType,i.uploadDate)
                    reports.append(r)
                cfg_list.append((s.name,s.sessionToken,reports))
            cfg_list.sort()
            self.cfg_list=cfg_list
            self.num_sessions=len(cfg_list)
        return



# The following 3 functions display information about the experiments and sessions in the database

# index() displays a list of all experiments, up to 10 config files listed per experiment
def index(request):
    session_list=Session.objects.all()
    experiment_names=[]
    for s in session_list:
        if s.expName not in experiment_names:
            experiment_names.append(s.expName)
    Exps=[]
    for j in experiment_names:
        e = Experiment_desc(j)
        Exps.append(e)
    return render(request, 'exp_index.html', {'experiments': Exps})

# experiment() displays information on a single experiment including every config file
def experiment(request, sessionToken):
    try:
        s = Session.objects.get(sessionToken=sessionToken)
    except:
        return render(request, 'session_not_found_error.html', {'token': sessionToken})

    e = Experiment_desc(s.expName)
    return render(request, 'experiment_info.html', {'exp': e, 'session': sessionToken})

# show_config() displays information on a single session
def show_config(request, sessionToken):
    try:
        s = Session.objects.get(sessionToken=sessionToken)
    except:
        return render(request, 'session_not_found_error.html', {'token': sessionToken})

    # Get any data reports on this session
    data_report = Report.objects.all().filter(sessionToken=sessionToken)
    return render(request, 'display_config.html', {'session': s, 'reports':data_report})

def show_data(request, sessionToken, pkid=''):
    try:
        s = Session.objects.get(sessionToken=sessionToken)
    except:
        return render(request, 'session_not_found_error.html', {'token': sessionToken})

    if pkid!='':
        data_report = Report.objects.all().filter(sessionToken=sessionToken,pk=int(pkid))
    else:
        data_report = Report.objects.all().filter(sessionToken=sessionToken)

    return render(request, 'display_data.html', {'session': s, 'reports':data_report})

from django import forms
class TokenForm(forms.Form):
    app_name = forms.CharField(label='Url to the experiment app', max_length=100)

def make_link_tokens(request, sessionToken):
    try:
        exp_name=Session.objects.get(sessionToken=sessionToken).expName
    except:
         return render(request, 'session_not_found_error.html', {'token': sessionToken})

    sessions=Session.objects.all().filter(expName=exp_name)
    session_list=[]
    if request.method=="POST":
        # generate token link list
        tokens=[]
        form=TokenForm(request.POST)
        if form.is_valid():
            for s in sessions:
                tokens.append(s.sessionToken)
        return render(request, 'link_tokens.html', {'app': form.cleaned_data['app_name'], 'tokens': tokens})

    # post form to fill in name of exp app link
    for s in sessions:
        session_list.append(s.name)
    form = TokenForm()
    return render(request, 'link_token_form.html', {'form': form, 'exp_name': exp_name, 'sessions': session_list})


# start() is the core experiment app communication function that distributes the cfg file text
#  in addition, this function logs a 'start' event

def start(request, sessionToken):
    try:
        s = Session.objects.get(sessionToken=sessionToken)
        cfg = s.configFile
    except:
        cfg='No such config file associated with token %s' % sessionToken
        return HttpResponse(cfg) # should have error template for bad info

    # add a line to the Report db indicating that this session was started
    r = Report(sessionToken=s.sessionToken,sessionKey=s,eventType='start',dataLog='')
    r.save()
    return HttpResponse(cfg)

def return_status(request, sessionToken):
    try:
        reports = Report.objects.filter(sessionToken=sessionToken,eventType='status').order_by('-uploadDate') # returns last status
    except:
        return HttpResponse('None') # no status is available, no data for this session yet

    if reports==None:
        return HttpResponse('None') # no status reports
    return HttpResponse(reports[0].dataLog)

# to do:
# close sessions when done to block spam uploads
# database 'test' reset to archive (to mark all sessions as available and archive all status/data events)

def report(request, sessionToken):
    if request.method=="POST":
        report_form = ReportForm(request.POST)
        if report_form.is_valid():
            r=report_form.save(commit=False)
            try:
                r.sessionKey=Session.objects.get(sessionToken=sessionToken)
                receipt=r.sessionKey.receiptToken
            except:
                # not a valid session, maybe don't save?
                r.sessionKey=None
                receipt="Invalid Session"
            r.save()
            # pass receipt token to display
            return render(request, 'report_accepted.html',{'receipt': receipt, 'log':r.dataLog})

    upload_form=ReportForm()
    return render(request, 'test_report.html',{'form':upload_form})

import zipfile, os.path
from datetime import date
from django.conf import settings
from django.core.files import File
#from django.views.static import serve

# construct a unique .txt file output name
def unique_txt(fn_list,cfg_name,event_type):
    base=os.path.splitext(cfg_name)[0]
    fn="%s_%s.txt" % (base,event_type)
    count=0
    while (fn in fn_list):
        count=count+1
        fn="%s_%s_%d.txt" % (base,event_type,count)
    return fn

# bulk data download for an entire experiment
def download_data(request, sessionToken):
    try:
        r=Session.objects.get(sessionToken=sessionToken)
    except:
        return render(request, 'session_not_found_error.html', {'token': sessionToken})

    count=0 # for duplicate filenames
    fn="%s_data_%s.zip" % (r.expName,date.today().strftime("%d%b%Y"))
    output_filename=os.path.join(settings.MEDIA_ROOT, settings.ZIP_TMP, fn)
    while os.path.exists(output_filename) and count<100:
        count=count+1
        fn="%s_data_%s_%d.zip" % (r.expName,date.today().strftime("%d%b%Y"),count)
        output_filename=os.path.join(settings.MEDIA_ROOT, settings.ZIP_TMP, fn)
    if count==100:
        return HttpResponse('Error creating output file')

    E=Experiment_desc(r.expName)
    output_zip=zipfile.ZipFile(output_filename, 'w')
    fn_list=[] # for tracking duplicate filenames in the output zip
    for s in E.cfg_list:
        # s[0]=name, s[1]=sessionToken, s[2]=list of report objects
        report_list=Report.objects.all().filter(sessionToken=s[1])
        for r in report_list:
            if len(r.dataLog.strip())>0: # only save events with some data -- the empty ones should be 'start' reports
                fn=unique_txt(fn_list,s[0],r.eventType)
                output_zip.writestr(fn,r.dataLog)
                fn_list.append(fn)

    output_zip.close()
    f=open(output_filename,'rb')
    response = HttpResponse(File(f),content_type='application/zip')
    response['Content-Disposition'] = "attachment; filename=%s" % os.path.basename(output_filename)
    response['Content-Length'] = os.path.getsize(output_filename)
    return response
    #return serve(request, os.path.basename(output_filename), os.path.dirname(output_filename))
    #return HttpResponse(fn_list)
    # filter by keywords like partial/complete?
