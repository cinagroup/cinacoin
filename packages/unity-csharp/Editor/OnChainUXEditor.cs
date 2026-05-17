using UnityEditor;
using UnityEngine;

namespace CinaConnect.Editor
{
    /// <summary>
    /// Unity Editor window for CinaConnect configuration.
    /// Allows setting project ID, relay URL, and app metadata via the Unity Editor.
    /// </summary>
    public class CinaConnectEditorWindow : EditorWindow
    {
        private string _projectId = "";
        private string _relayUrl = "wss://relay.walletconnect.com";
        private string _appName = "";
        private string _appDescription = "";
        private string _appUrl = "";
        private string _appIcons = "";
        private bool _enableDebugLogs = true;

        [MenuItem("Window/CinaConnect/Configuration")]
        public static void ShowWindow()
        {
            var window = GetWindow<CinaConnectEditorWindow>("CinaConnect Config");
            window.minSize = new Vector2(350, 300);
            LoadSettings();
        }

        private static void LoadSettings()
        {
            // Load from EditorPrefs if available
        }

        private void OnGUI()
        {
            EditorGUILayout.Space(10);
            EditorGUILayout.LabelField("CinaConnect Configuration", EditorStyles.boldLabel);
            EditorGUILayout.Space(5);

            EditorGUI.BeginChangeCheck();

            _projectId = EditorGUILayout.TextField("Project ID", _projectId);
            _relayUrl = EditorGUILayout.TextField("Relay URL", _relayUrl);

            EditorGUILayout.Space(10);
            EditorGUILayout.LabelField("App Metadata", EditorStyles.boldLabel);
            EditorGUILayout.Space(5);

            _appName = EditorGUILayout.TextField("App Name", _appName);
            _appDescription = EditorGUILayout.TextArea(_appDescription, GUILayout.Height(60));
            _appUrl = EditorGUILayout.TextField("App URL", _appUrl);
            _appIcons = EditorGUILayout.TextField("Icon URLs (comma-separated)", _appIcons);

            EditorGUILayout.Space(10);
            _enableDebugLogs = EditorGUILayout.Toggle("Enable Debug Logs", _enableDebugLogs);

            if (EditorGUI.EndChangeCheck())
            {
                SaveSettings();
            }

            EditorGUILayout.Space(20);

            if (GUILayout.Button("Generate Config JSON"))
            {
                GenerateConfigJson();
            }

            if (GUILayout.Button("Add CinaConnect Manager to Scene"))
            {
                AddManagerToScene();
            }

            EditorGUILayout.Space(10);
            EditorGUILayout.HelpBox(
                "Configure your CinaConnect project ID and app metadata here.\n" +
                "Click 'Generate Config JSON' to create a configuration file.",
                MessageType.Info
            );
        }

        private void SaveSettings()
        {
            EditorPrefs.SetString("CinaConnect_ProjectId", _projectId);
            EditorPrefs.SetString("CinaConnect_RelayUrl", _relayUrl);
            EditorPrefs.SetString("CinaConnect_AppName", _appName);
            EditorPrefs.SetString("CinaConnect_AppDescription", _appDescription);
            EditorPrefs.SetString("CinaConnect_AppUrl", _appUrl);
            EditorPrefs.SetString("CinaConnect_AppIcons", _appIcons);
            EditorPrefs.SetBool("CinaConnect_DebugLogs", _enableDebugLogs);
        }

        private void GenerateConfigJson()
        {
            var icons = string.IsNullOrEmpty(_appIcons)
                ? "[]"
                : $"[\"{string.Join("\", \"", _appIcons.Split(','))}\"]";

            var json = $@"{{
  ""projectId"": ""{_projectId}"",
  ""metadata"": {{
    ""name"": ""{_appName}"",
    ""description"": ""{_appDescription}"",
    ""url"": ""{_appUrl}"",
    ""icons"": {icons}
  }},
  ""relayUrl"": ""{_relayUrl}""
}}";

            var path = EditorUtility.SaveFilePanel("Save Config", "Assets", "cinaconnect_config.json", "json");
            if (!string.IsNullOrEmpty(path))
            {
                System.IO.File.WriteAllText(path, json);
                AssetDatabase.Refresh();
                Debug.Log($"CinaConnect config saved to: {path}");
            }
        }

        private void AddManagerToScene()
        {
            var manager = FindObjectOfType<CinaConnectManager>();
            if (manager == null)
            {
                var go = new GameObject("[CinaConnect]");
                manager = go.AddComponent<CinaConnectManager>();

                // Set project ID from settings
                var serialized = new SerializedObject(manager);
                serialized.FindProperty("_projectId").stringValue = _projectId;
                serialized.FindProperty("_relayUrl").stringValue = _relayUrl;
                serialized.FindProperty("_enableDebugLogs").boolValue = _enableDebugLogs;
                serialized.ApplyModifiedProperties();

                Undo.RegisterCreatedObjectUndo(go, "Create CinaConnect Manager");
                Selection.activeGameObject = go;

                Debug.Log("CinaConnect Manager added to scene");
            }
            else
            {
                EditorUtility.DisplayDialog(
                    "CinaConnect",
                    "CinaConnect Manager already exists in the scene.",
                    "OK"
                );
            }
        }
    }
}
