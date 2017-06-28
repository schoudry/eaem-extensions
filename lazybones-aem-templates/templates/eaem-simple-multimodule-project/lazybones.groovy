import uk.co.cacoethes.util.NameType
import org.apache.commons.io.FileUtils

def writeToFile(File dir, String fileName, String content) {
    FileUtils.write(new File(dir, fileName), content, fileEncoding)
}

def props = [:]

props.groupId = ask("Maven group ID for the generated project [apps.experienceaem]: ", "apps.experienceaem", "groupId")
props.artifactId = ask("Maven artifact ID for the generated reactor project [eaem-project]: ", "eaem-project", "artifactId")
props.projectName = ask("Human readable project name [Experience AEM Project]: ", "Experience AEM Project", "projectName")

def defaultFolderName = transformText(props.projectName, from: NameType.NATURAL, to: NameType.HYPHENATED).toLowerCase()
props.appsFolderName = ask("Folder name under /apps for extensions [${defaultFolderName}]: ", defaultFolderName, "appsFolderName")

println "Processing README..."
processTemplates "README.md", props

println "Processing pom files..."
processTemplates "**/pom.xml", props

println "Processing package metafiles..."
processTemplates "content/src/main/content/META-INF/vault/properties.xml", props
processTemplates "content/src/main/content/META-INF/vault/filter.xml", props
processTemplates "content/src/main/content/META-INF/vault/definition/.content.xml", props

println "Creating folders..."
def appsFolderDir = new File(projectDir, "bundle/src/main/java/apps/experienceaem")
appsFolderDir.mkdirs()

def contentFolderDir = new File(projectDir, "content/src/main/content/jcr_root/apps/${props.appsFolderName}")
contentFolderDir.mkdirs()

def installDir = new File(projectDir, "content/src/main/content/jcr_root/apps/${props.appsFolderName}/install")
installDir.mkdirs()
writeToFile(installDir, ".vltignore", "*.jar")

def clientLibFolder = new File(projectDir, "content/src/main/content/jcr_root/apps/${props.appsFolderName}/clientlib")
clientLibFolder.mkdirs()

writeToFile(clientLibFolder, ".content.xml", """\
<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:jcr="http://www.jcp.org/jcr/1.0"
    jcr:primaryType="cq:ClientLibraryFolder"
    categories="[cq.authoring.dialog.all]"/>
""")

writeToFile(clientLibFolder, "readme.txt", """\
This client library should be used to store your site's JavaScript and CSS.
In general, you should load the CSS in the head and the JS just before the end of the body.
""")

writeToFile(clientLibFolder, "js.txt", "")
writeToFile(clientLibFolder, "css.txt", "")