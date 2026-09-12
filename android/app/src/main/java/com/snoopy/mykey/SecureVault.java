package com.snoopy.mykey;

import android.app.Activity;
import android.content.Context;
import android.hardware.biometrics.BiometricPrompt;
import android.os.Build;
import android.os.CancellationSignal;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import android.util.Base64;
import org.json.JSONObject;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Arrays;
import java.util.UUID;

final class SecureVault {
    interface Result { void success(byte[] bytes); void failure(String message); }
    static File file(Context c, String name) { return new File(c.getNoBackupFilesDir(), name); }
    static JSONObject read(Context c, String name) throws Exception { return new JSONObject(new String(new AtomicFile(file(c,name)).readFully(), StandardCharsets.UTF_8)); }
    static void write(Context c, String name, JSONObject value) throws Exception {
        AtomicFile target=new AtomicFile(file(c,name)); FileOutputStream out=null;
        try { out=target.startWrite(); out.write(value.toString().getBytes(StandardCharsets.UTF_8)); target.finishWrite(out); }
        catch(Exception e) { if(out!=null)target.failWrite(out); throw e; }
    }
    static String vaultId(JSONObject envelope) throws Exception { JSONObject m=envelope.getJSONObject("meta");return m.optString("vaultId",m.getString("createdAt")); }
    static boolean enrolled(Context c) {
        try { JSONObject record=read(c,"biometric.json"); return record.getString("vaultId").equals(vaultId(read(c,"vault.json"))) && keyStore().containsAlias(record.getString("alias")); } catch(Exception e){ return false; }
    }
    static KeyStore keyStore() throws Exception { KeyStore store=KeyStore.getInstance("AndroidKeyStore"); store.load(null); return store; }
    static void disable(Context c) throws Exception {
        if(file(c,"biometric.json").exists()) { JSONObject old=read(c,"biometric.json"); keyStore().deleteEntry(old.getString("alias")); }
        new AtomicFile(file(c,"biometric.json")).delete();
    }
    static byte[] bytes(String s){return Base64.decode(s,Base64.NO_WRAP);}
    static String b64(byte[] b){return Base64.encodeToString(b,Base64.NO_WRAP);}
    static CancellationSignal authenticate(Activity activity, byte[] enrollmentKey, String vaultId, Result callback) throws Exception {
        if(Build.VERSION.SDK_INT<28)throw new Exception("ต้องใช้ Android 9 ขึ้นไป");
        final boolean enroll=enrollmentKey!=null;
        final String alias; final JSONObject record;
        Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
        if(enroll){
            alias="mykey-biometric-"+UUID.randomUUID(); record=new JSONObject();
            KeyGenerator generator=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");
            KeyGenParameterSpec.Builder spec=new KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT)
                .setKeySize(256).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setUserAuthenticationRequired(true).setInvalidatedByBiometricEnrollment(true);
            if(Build.VERSION.SDK_INT>=30)spec.setUserAuthenticationParameters(0,KeyProperties.AUTH_BIOMETRIC_STRONG);
            else spec.setUserAuthenticationValidityDurationSeconds(-1);
            generator.init(spec.build()); cipher.init(Cipher.ENCRYPT_MODE,generator.generateKey());
        }else{
            record=read(activity,"biometric.json");alias=record.getString("alias");
            if(!record.getString("vaultId").equals(vaultId(read(activity,"vault.json"))))throw new Exception("ตู้เซฟเปลี่ยน กรุณาเปิดสแกนนิ้วใหม่");
            cipher.init(Cipher.DECRYPT_MODE,(SecretKey)keyStore().getKey(alias,null),new GCMParameterSpec(128,bytes(record.getString("iv"))));
        }
        CancellationSignal signal=new CancellationSignal();
        BiometricPrompt.Builder builder=new BiometricPrompt.Builder(activity).setTitle(enroll?"เปิดสแกนนิ้ว My Key":"ปลดล็อก My Key")
            .setSubtitle("ยืนยันตัวตนเพื่อใช้กุญแจตู้เซฟในเครื่องนี้")
            .setNegativeButton("ยกเลิก",activity.getMainExecutor(),(dialog,which)->signal.cancel());
        if(Build.VERSION.SDK_INT>=30)builder.setAllowedAuthenticators(android.hardware.biometrics.BiometricManager.Authenticators.BIOMETRIC_STRONG);
        builder.build().authenticate(new BiometricPrompt.CryptoObject(cipher),signal,activity.getMainExecutor(),new BiometricPrompt.AuthenticationCallback(){
            private void clean(){ if(enrollmentKey!=null)Arrays.fill(enrollmentKey,(byte)0); }
            @Override public void onAuthenticationError(int code,CharSequence message){
                clean(); if(enroll)try{keyStore().deleteEntry(alias);}catch(Exception ignored){} callback.failure("ยืนยันตัวตนไม่สำเร็จ / ยกเลิก กรุณาใช้ Master Password");
            }
            @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result){
                try{
                    Cipher authenticated=result.getCryptoObject().getCipher();
                    if(enroll){
                        String previous=null;try{previous=read(activity,"biometric.json").getString("alias");}catch(Exception ignored){}
                        JSONObject data=new JSONObject().put("alias",alias).put("vaultId",vaultId).put("iv",b64(authenticated.getIV())).put("ciphertext",b64(authenticated.doFinal(enrollmentKey)));
                        write(activity,"biometric.json",data);
                        if(previous!=null)keyStore().deleteEntry(previous);
                        callback.success(new byte[0]);
                    }else callback.success(authenticated.doFinal(bytes(record.getString("ciphertext"))));
                }catch(Exception e){callback.failure("กุญแจใช้ไม่ได้ กรุณาใช้ Master Password และเปิดสแกนนิ้วใหม่");}
                finally{clean();}
            }
        });
        return signal;
    }
    static JSONObject decryptPayload(JSONObject envelope, byte[] raw) throws Exception {
        JSONObject blob=envelope.getJSONObject("vault");Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE,new SecretKeySpec(raw,"AES"),new GCMParameterSpec(128,bytes(blob.getString("iv"))));
        byte[] clear=cipher.doFinal(bytes(blob.getString("ciphertext")));
        try { String json=new String(clear,StandardCharsets.UTF_8); return json.startsWith("[")?new JSONObject().put("items",new org.json.JSONArray(json)):new JSONObject(json); }
        finally {Arrays.fill(clear,(byte)0);}
    }
}
