package com.snoopy.mykey;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.os.CancellationSignal;
import android.os.SystemClock;
import android.service.autofill.*;
import android.widget.RemoteViews;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class MyKeyAutofillService extends AutofillService {
 static final Map<String,Request> requests=new ConcurrentHashMap<>();
 static class Request { final FillFields fields;final String certificate;final long at=SystemClock.elapsedRealtime(); Request(FillFields f,String c){fields=f;certificate=c;} }
 @Override public void onFillRequest(FillRequest request,CancellationSignal cancellation,FillCallback callback){
   if(Build.VERSION.SDK_INT<28||!SecureVault.enrolled(this)||request.getFillContexts().isEmpty()){callback.onSuccess(null);return;}
   try{
     requests.entrySet().removeIf(e->SystemClock.elapsedRealtime()-e.getValue().at>60000);
     FillFields fields=FillFields.parse(request.getFillContexts().get(request.getFillContexts().size()-1).getStructure());
     if(!fields.valid()||fields.packageName.equals(getPackageName())){callback.onSuccess(null);return;}
     String certificate=NativeVaultPlugin.certificate(this,fields.packageName);
     if(requests.size()>30)requests.clear();
     String token=UUID.randomUUID().toString();requests.put(token,new Request(fields,certificate));
     Intent intent=new Intent(this,AutofillAuthActivity.class).putExtra("requestToken",token).setData(android.net.Uri.parse("mykey-auth:"+token));
     PendingIntent pending=PendingIntent.getActivity(this,0,intent,PendingIntent.FLAG_ONE_SHOT|PendingIntent.FLAG_IMMUTABLE);
     cancellation.setOnCancelListener(()->{requests.remove(token);pending.cancel();});
     if(cancellation.isCanceled()){requests.remove(token);return;}
     RemoteViews presentation=new RemoteViews(getPackageName(),android.R.layout.simple_list_item_1);presentation.setTextViewText(android.R.id.text1,"My Key — สแกนนิ้วเพื่อเลือกรหัส");
     callback.onSuccess(new FillResponse.Builder().setAuthentication(fields.ids(),pending.getIntentSender(),presentation).build());
   }catch(Exception e){callback.onSuccess(null);}
 }
 @Override public void onSaveRequest(SaveRequest request,SaveCallback callback){callback.onFailure("เพิ่มรหัสใหม่ในแอป My Key");}
}
