package com.snoopy.mykey;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.ResolveInfo;
import android.content.pm.PackageManager;
import android.hardware.fingerprint.FingerprintManager;
import android.os.Build;
import android.os.CancellationSignal;
import android.os.Handler;
import android.os.Looper;
import android.net.Uri;
import android.provider.Settings;
import android.view.autofill.AutofillManager;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import org.json.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@CapacitorPlugin(name="NativeVault")
public class NativeVaultPlugin extends Plugin {
    private CancellationSignal prompt;
    private final Handler handler=new Handler(Looper.getMainLooper());
    private Runnable wipe;
    static String certificate(Context context,String packageName) throws Exception {
        PackageInfo info=context.getPackageManager().getPackageInfo(packageName,PackageManager.GET_SIGNING_CERTIFICATES);
        if(info.signingInfo==null || info.signingInfo.hasMultipleSigners())throw new Exception("Unsupported signer");
        byte[] digest=MessageDigest.getInstance("SHA-256").digest(info.signingInfo.getApkContentsSigners()[0].toByteArray());
        StringBuilder out=new StringBuilder();for(byte b:digest)out.append(String.format(Locale.ROOT,"%02x",b));return out.toString();
    }
    @PluginMethod public void status(PluginCall call){
        boolean available=false;
        if(Build.VERSION.SDK_INT>=30) available=getContext().getSystemService(android.hardware.biometrics.BiometricManager.class).canAuthenticate(android.hardware.biometrics.BiometricManager.Authenticators.BIOMETRIC_STRONG)==0;
        else if(Build.VERSION.SDK_INT>=28){FingerprintManager f=getContext().getSystemService(FingerprintManager.class);available=f!=null&&f.isHardwareDetected()&&f.hasEnrolledFingerprints();}
        AutofillManager a=Build.VERSION.SDK_INT>=26?getContext().getSystemService(AutofillManager.class):null;
        JSObject result=new JSObject();result.put("available",available);result.put("enrolled",SecureVault.enrolled(getContext()));result.put("autofillEnabled",a!=null&&a.hasEnabledAutofillServices());call.resolve(result);
    }
    @PluginMethod public void saveEnvelope(PluginCall call){
        try{
            JSONObject data=new JSONObject(call.getString("envelope",""));
            JSONObject meta=data.getJSONObject("meta");meta.remove("wrappedByPin");meta.remove("pinSalt");
            data.getJSONObject("vault").getString("ciphertext");
            SecureVault.write(getContext(),"vault.json",data);call.resolve();
        }catch(Exception e){call.reject("บันทึกสำเนา Autofill ไม่สำเร็จ");}
    }
    private void authenticate(PluginCall call,boolean enroll){getActivity().runOnUiThread(()->{
        if(prompt!=null){call.reject("กำลังยืนยันตัวตนอยู่");return;}
        try{
            byte[] raw=enroll?SecureVault.bytes(call.getString("rawKey","")):null;
            if(enroll&&(raw.length!=32||call.getString("vaultId")==null))throw new Exception("Invalid key");
            prompt=SecureVault.authenticate(getActivity(),raw,call.getString("vaultId"),new SecureVault.Result(){
                public void success(byte[] bytes){prompt=null;JSObject result=new JSObject();if(!enroll)result.put("rawKey",SecureVault.b64(bytes));Arrays.fill(bytes,(byte)0);call.resolve(result);}
                public void failure(String message){prompt=null;call.reject(message);}
            });
        }catch(Exception e){prompt=null;call.reject("สแกนนิ้วใช้ไม่ได้ กรุณาใช้ Master Password");}
    });}
    @PluginMethod public void enroll(PluginCall call){authenticate(call,true);}
    @PluginMethod public void unlock(PluginCall call){authenticate(call,false);}
    @PluginMethod public void disable(PluginCall call){try{SecureVault.disable(getContext());call.resolve();}catch(Exception e){call.reject("ยกเลิกกุญแจไม่สำเร็จ");}}
    @Override protected void handleOnPause(){
        notifyListeners("background",new JSObject(),true);
        if(prompt!=null)prompt.cancel();
    }
    @PluginMethod public void listApps(PluginCall call){
        if(Build.VERSION.SDK_INT<28){call.reject("ต้องใช้ Android 9 ขึ้นไป");return;}
        try{
            Intent query=new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> resolved=getContext().getPackageManager().queryIntentActivities(query,0);
            JSArray apps=new JSArray();Set<String> seen=new HashSet<>();
            for(ResolveInfo info:resolved){String name=info.activityInfo.packageName;if(name.equals(getContext().getPackageName())||!seen.add(name))continue;
                try{JSObject a=new JSObject();a.put("packageName",name);a.put("label",info.loadLabel(getContext().getPackageManager()).toString());a.put("certificate",certificate(getContext(),name));apps.put(a);}catch(Exception ignored){}
            }JSObject result=new JSObject();result.put("apps",apps);call.resolve(result);
        }catch(Exception e){call.reject("อ่านรายชื่อแอปไม่สำเร็จ");}
    }
    @PluginMethod public void openAutofillSettings(PluginCall call){
        if(Build.VERSION.SDK_INT<26){call.reject("Autofill ต้องใช้ Android 8 ขึ้นไป");return;}
        Intent intent=new Intent(Settings.ACTION_REQUEST_SET_AUTOFILL_SERVICE,Uri.parse("package:"+getContext().getPackageName()));getActivity().startActivity(intent);call.resolve();
    }
    @PluginMethod public void copy(PluginCall call){
        String text=call.getString("text","");int seconds=call.getInt("seconds",30);
        getActivity().runOnUiThread(()->{
            ClipboardManager clipboard=getContext().getSystemService(ClipboardManager.class);
            ClipData clip=ClipData.newPlainText("My Key",text);
            if(Build.VERSION.SDK_INT>=33){android.os.PersistableBundle extras=new android.os.PersistableBundle();extras.putBoolean("android.content.extra.IS_SENSITIVE",true);clip.getDescription().setExtras(extras);}
            clipboard.setPrimaryClip(clip);
            if(wipe!=null)handler.removeCallbacks(wipe);
            if(seconds>0){wipe=()->{try{ClipData current=clipboard.getPrimaryClip();if(current!=null&&current.getItemCount()>0&&text.contentEquals(current.getItemAt(0).coerceToText(getContext())))clipboard.setPrimaryClip(ClipData.newPlainText("",""));}catch(Exception ignored){}};handler.postDelayed(wipe,Math.min(seconds,60)*1000L);}
            call.resolve();
        });
    }
    @PluginMethod public void exportFile(PluginCall call){
        Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(call.getString("mime","application/json")).putExtra(Intent.EXTRA_TITLE,call.getString("name","mykey-backup.json"));
        startActivityForResult(call,intent,"exportResult");
    }
    @ActivityCallback private void exportResult(PluginCall call,ActivityResult result){
        if(call==null)return;
        if(result.getResultCode()!=Activity.RESULT_OK||result.getData()==null){call.reject("ยกเลิกการบันทึกไฟล์");return;}
        try(java.io.OutputStream stream=getContext().getContentResolver().openOutputStream(result.getData().getData())){
            if(stream==null)throw new Exception();stream.write(call.getString("content","").getBytes(StandardCharsets.UTF_8));call.resolve();
        }catch(Exception e){call.reject("บันทึกไฟล์ไม่สำเร็จ");}
    }
}
