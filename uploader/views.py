from django.shortcuts import render, get_object_or_404
from django.http import HttpResponseRedirect, HttpResponse
from django.core.urlresolvers import reverse

from uploader.models import ZipUpload, ZipUploadForm, ExpImage
from exp.models import Session

# for unpacking archives
from django.conf import settings
from django.contrib.auth.decorators import login_required
import zipfile, os.path


# If request.method == POST, then this is being called with a filled form to be processed
#  Otherwise, post the form to be filled in
@login_required
def index(request):
    if request.method=="POST":
        zip_form = ZipUploadForm(request.POST, request.FILES)
        if zip_form.is_valid():
            original_filename=os.path.splitext(os.path.basename(request.FILES['zip'].name))[0]
            z=zip_form.save(commit=False)
            z.group=original_filename
            z.upload_user=request.user
            z.save()
            return HttpResponseRedirect(reverse('uploader_unpack', args=(z.pk,)))

    upload_form=ZipUploadForm()
    file_list=ZipUpload.objects.all()
    image_list=ExpImage.objects.all()
    # group image_list by the .group tags
    return render(request, 'uploader_index.html',{'form':upload_form, 'zip_list':file_list, 'image_list':image_list, 'user':request.user})

def is_image_file(fn):
    # Just checking by filename extension
    ext=os.path.splitext(fn)[1]
    if ext in ['.jpg','.png','.gif','.ppm', '.GIF', '.JPG', '.PNG', '.PPM']:
        return True
    return False

@login_required
def unpack(request, zip_file_id):
    unpack_log=[]
    z=int(zip_file_id)
    p = get_object_or_404(ZipUpload, pk=z)
    try:
        fn = p.zip.path
    except:
        unpack_log.append("No zipfile %d" % z)
        return render(request, 'uploader_unpack.html', {'log': unpack_log, 'user':request.user})

    # Use a template to construct the report
    unpack_log.append("Found zipfile %d, %s" % (z,fn))
    zf = zipfile.ZipFile(fn)
    file_list = zf.infolist()
    for f in file_list:
        unpack_log.append("--- File: %s" % f.filename)

    output_dir=os.path.join(os.path.dirname(settings.MEDIA_ROOT),p.group)
    # unpack_log.append("Output dir: %s" % output_dir)

    for f in file_list:
        if is_image_file(f.filename): # unpack and store in MEDIA directory (/images)
            if not os.path.exists(output_dir):
                os.mkdir(output_dir)
                unpack_log.append("Created output directory %s" % output_dir)
            if not os.path.exists(os.path.join(output_dir,f.filename)):
                zf.extract(f,output_dir)
                unpack_log.append("Extracting image file %s to %s" % (f.filename,output_dir))
                img = ExpImage.objects.create(filename=f.filename,group=p.group,upload_user=request.user)
            else:
                unpack_log.append("Not extracting image file %s, already exists" % f.filename)
        else: # non-image files are assumed to be config files, extract to memory and store in session db
            fp = zf.open(f.filename)
            cfg=fp.read()
            fp.close()
            e = Session.objects.create_session(name=f.filename,configFile=cfg,expName=p.group) # this will allow duplicate filenames but seesionTokens should be unique
            unpack_log.append("Added config file %s to experiment %s" % (f.filename,p.group))
    # Display unpacking log
    return render(request, 'uploader_unpack.html', {'log': unpack_log, 'user':request.user})




