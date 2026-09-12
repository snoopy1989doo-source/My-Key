package com.snoopy.mykey;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.SystemClock;
import android.service.autofill.Dataset;
import android.service.autofill.FillResponse;
import android.view.WindowManager;
import android.view.autofill.AutofillManager;
import android.view.autofill.AutofillValue;
import android.widget.RemoteViews;
import android.widget.TextView;
import org.json.*;
import java.util.*;

public class AutofillAuthActivity extends Activity {
 private CancellationSignal signal;
 private MyKeyAutofillService.Request request;
 private AlertDialog choices;
 @Override public void onCreate(Bundle state){
   super.onCreate(state);setResult(RESULT_CANCELED);getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
   TextView label=new TextView(this);label.setText("My Key — ยืนยันตัวตนก่อนกรอกข้อมูล");label.setPadding(32,64,32,32);setContentView(label);
   request=MyKeyAutofillService.requests.remove(getIntent().getStringExtra("requestToken"));
   if(!valid()){finish();return;}
   try{signal=SecureVault.authenticate(this,null,null,new SecureVault.Result(){
     public void failure(String message){if(!isFinishing())finish();}
     public void success(byte[] raw){
       try{
         if(!valid()){finish();return;}
         JSONArray items=SecureVault.decryptPayload(SecureVault.read(AutofillAuthActivity.this,"vault.json"),raw).getJSONArray("items");
         ArrayList<JSONObject> matches=new ArrayList<>();ArrayList<String> labels=new ArrayList<>();
         for(int i=0;i<items.length();i++){JSONObject item=items.getJSONObject(i);
           if(request.fields.packageName.equals(item.optString("androidPackage"))&&request.certificate.equals(item.optString("androidCertSha256"))&&!item.optString("password").isEmpty()){
             matches.add(item);labels.add(item.optString("title")+" — "+item.optString("username"));
           }
         }
         if(matches.isEmpty()){choices=new AlertDialog.Builder(AutofillAuthActivity.this).setTitle("ยังไม่มีบัญชีที่ผูกกับแอปนี้").setMessage("เปิดรายละเอียดรหัสใน My Key แล้วเลือกแอปเป้าหมายสำหรับ Autofill").setPositiveButton("ปิด",(d,w)->finish()).setOnCancelListener(d->finish()).show();return;}
         String appLabel=getPackageManager().getApplicationLabel(getPackageManager().getApplicationInfo(request.fields.packageName,0)).toString();
         choices=new AlertDialog.Builder(AutofillAuthActivity.this).setTitle("กรอกให้ "+appLabel).setItems(labels.toArray(new String[0]),(dialog,index)->{
           try{
             if(!valid()){finish();return;}
             JSONObject item=matches.get(index);RemoteViews view=new RemoteViews(getPackageName(),android.R.layout.simple_list_item_1);view.setTextViewText(android.R.id.text1,item.optString("title"));
             Dataset.Builder dataset=new Dataset.Builder(view).setValue(request.fields.password,AutofillValue.forText(item.getString("password")));
             if(request.fields.username!=null)dataset.setValue(request.fields.username,AutofillValue.forText(item.optString("username")));
             Intent result=new Intent().putExtra(AutofillManager.EXTRA_AUTHENTICATION_RESULT,new FillResponse.Builder().addDataset(dataset.build()).build());setResult(RESULT_OK,result);
           }catch(Exception ignored){}finally{matches.clear();labels.clear();finish();}
         }).setNegativeButton("ยกเลิก",(d,w)->{matches.clear();finish();}).setOnCancelListener(d->{matches.clear();finish();}).show();
       }catch(Exception e){finish();}finally{Arrays.fill(raw,(byte)0);}
     }
   });}catch(Exception e){finish();}
 }
 private boolean valid(){
   if(request==null||SystemClock.elapsedRealtime()-request.at>60000||isFinishing())return false;
   try{return request.certificate.equals(NativeVaultPlugin.certificate(this,request.fields.packageName))&&SecureVault.enrolled(this);}catch(Exception e){return false;}
 }
 @Override protected void onStop(){super.onStop();if(signal!=null)signal.cancel();if(choices!=null)choices.dismiss();request=null;finish();}
}
