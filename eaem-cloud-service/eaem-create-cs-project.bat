set JAVA_HOME=C:/Progra~1/Java/jdk-11.0.6

mvn -B org.apache.maven.plugins:maven-archetype-plugin:3.2.1:generate -D archetypeGroupId=com.adobe.aem -D archetypeArtifactId=aem-project-archetype -D archetypeVersion=36 -D aemVersion="cloud" -D appTitle="Experience AEM URL Rewrite Subsitute" -D appId="eaem-url-rewrite-apache-substitute" -D groupId="apps.eaem.sites" -D frontendModule=none -D includeExamples=n -D includeDispatcherConfig=y

REM mvn -B archetype:generate -D archetypeGroupId=com.adobe.aem -D archetypeArtifactId=aem-project-archetype -D archetypeVersion="28" -D appTitle="Experience AEM React SSR" -D aemVersion="cloud" -D appId="eaem-cs-react-ssr" -D groupId="apps.experienceaem.sites" -D enableSSR="y" -D frontendModule="react" -D includeExamples=n -D includeDispatcherConfig=n -U