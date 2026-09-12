package com.snoopy.mykey;
import android.app.assist.AssistStructure;
import android.view.View;
import android.view.autofill.AutofillId;
import android.text.InputType;
import java.util.ArrayList;

final class FillFields {
 String packageName; AutofillId username,password; boolean web=false,ambiguous=false; int nodes=0;
 static FillFields parse(AssistStructure structure){
   FillFields fields=new FillFields();fields.packageName=structure.getActivityComponent().getPackageName();
   for(int i=0;i<structure.getWindowNodeCount();i++)fields.walk(structure.getWindowNodeAt(i).getRootViewNode(),0);
   return fields;
 }
 private void walk(AssistStructure.ViewNode node,int depth){
   if(depth>50||++nodes>3000){ambiguous=true;return;}
   if(node.getWebDomain()!=null||"android.webkit.WebView".contentEquals(node.getClassName()==null?"":node.getClassName()))web=true;
   boolean user=false,pass=false;
   String[] hints=node.getAutofillHints();
   if(hints!=null)for(String hint:hints){
      if(View.AUTOFILL_HINT_USERNAME.equals(hint)||View.AUTOFILL_HINT_EMAIL_ADDRESS.equals(hint))user=true;
      if(View.AUTOFILL_HINT_PASSWORD.equals(hint))pass=true;
      if("newPassword".equals(hint)||"newUsername".equals(hint))ambiguous=true;
   }
   int input=node.getInputType();int variation=input&InputType.TYPE_MASK_VARIATION;
   if((input&InputType.TYPE_MASK_CLASS)==InputType.TYPE_CLASS_TEXT){
      pass|=variation==InputType.TYPE_TEXT_VARIATION_PASSWORD||variation==InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD;
      user|=variation==InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS;
   }
   if(node.getAutofillId()!=null && node.getAutofillType()==View.AUTOFILL_TYPE_TEXT){
     if(user){if(username!=null&&!username.equals(node.getAutofillId()))ambiguous=true;username=node.getAutofillId();}
     if(pass){if(password!=null&&!password.equals(node.getAutofillId()))ambiguous=true;password=node.getAutofillId();}
   }
   for(int i=0;i<node.getChildCount();i++)walk(node.getChildAt(i),depth+1);
 }
 boolean valid(){return !web&&!ambiguous&&password!=null;}
 AutofillId[] ids(){ArrayList<AutofillId> ids=new ArrayList<>();if(username!=null)ids.add(username);ids.add(password);return ids.toArray(new AutofillId[0]);}
}
