import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import Layout from "../components/Layout";
import { 
  Plus, 
  FolderGit2, 
  ExternalLink, 
  MoreVertical,
  Trash2,
  Clock,
  AlertTriangle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "sonner";

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    repo_url: "",
    description: "",
    scan_types: ["dependencies"]
  });
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/projects`, { withCredentials: true });
      setProjects(res.data.projects || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/projects`, formData, { withCredentials: true });
      toast.success("Project created successfully");
      setIsDialogOpen(false);
      setFormData({ name: "", repo_url: "", description: "", scan_types: ["dependencies"] });
      fetchProjects();
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await axios.delete(`${API}/projects/${projectId}`, { withCredentials: true });
      toast.success("Project deleted");
      fetchProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
    }
  };

  const toggleScanType = (type) => {
    setFormData(prev => ({
      ...prev,
      scan_types: prev.scan_types.includes(type)
        ? prev.scan_types.filter(t => t !== type)
        : [...prev.scan_types, type]
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 animate-pulse">
          <div className="h-8 w-48 rounded mb-8" style={{ backgroundColor: 'var(--surface-2)' }}></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-48 rounded" style={{ backgroundColor: 'var(--surface-1)' }}></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 
              className="text-2xl md:text-3xl font-bold tracking-tight mb-2"
              style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
            >
              Projects
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Manage your repositories and scan configurations
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="btn-primary rounded-sm"
                data-testid="add-project-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="sm:max-w-md"
              style={{ 
                backgroundColor: 'var(--surface-1)', 
                borderColor: 'var(--border-default)' 
              }}
            >
              <DialogHeader>
                <DialogTitle 
                  style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
                >
                  Add New Project
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <Label htmlFor="name" style={{ color: 'var(--text-body)' }}>Project Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Awesome Project"
                    required
                    className="mt-1"
                    style={{ 
                      backgroundColor: 'var(--app-bg)', 
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-heading)'
                    }}
                    data-testid="project-name-input"
                  />
                </div>

                <div>
                  <Label htmlFor="repo_url" style={{ color: 'var(--text-body)' }}>Repository URL</Label>
                  <Input
                    id="repo_url"
                    value={formData.repo_url}
                    onChange={(e) => setFormData({ ...formData, repo_url: e.target.value })}
                    placeholder="https://github.com/user/repo"
                    required
                    className="mt-1"
                    style={{ 
                      backgroundColor: 'var(--app-bg)', 
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-heading)'
                    }}
                    data-testid="project-repo-input"
                  />
                </div>

                <div>
                  <Label htmlFor="description" style={{ color: 'var(--text-body)' }}>Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    className="mt-1"
                    style={{ 
                      backgroundColor: 'var(--app-bg)', 
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-heading)'
                    }}
                    data-testid="project-description-input"
                  />
                </div>

                <div>
                  <Label style={{ color: 'var(--text-body)' }}>Scan Types</Label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {["dependencies", "containers", "iac"].map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <Checkbox
                          id={`scan-${type}`}
                          checked={formData.scan_types.includes(type)}
                          onCheckedChange={() => toggleScanType(type)}
                          data-testid={`scan-type-${type}`}
                        />
                        <label 
                          htmlFor={`scan-${type}`} 
                          className="text-sm capitalize cursor-pointer"
                          style={{ color: 'var(--text-body)' }}
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="btn-secondary rounded-sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="btn-primary rounded-sm"
                    data-testid="create-project-btn"
                  >
                    Create Project
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.project_id}
                className="card-surface rounded-md p-6 cursor-pointer transition-all"
                onClick={() => navigate(`/projects/${project.project_id}`)}
                data-testid={`project-card-${project.project_id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded flex items-center justify-center"
                      style={{ backgroundColor: 'var(--primary-muted)' }}
                    >
                      <FolderGit2 className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                      <h3 
                        className="font-semibold"
                        style={{ fontFamily: 'Chivo, sans-serif', color: 'var(--text-heading)' }}
                      >
                        {project.name}
                      </h3>
                      <a
                        href={project.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs flex items-center gap-1 hover:underline"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {project.repo_url?.replace("https://github.com/", "")}
                      </a>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 rounded hover:bg-[var(--surface-hover)]">
                        <MoreVertical className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      style={{ 
                        backgroundColor: 'var(--surface-1)', 
                        borderColor: 'var(--border-default)' 
                      }}
                    >
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.project_id);
                        }}
                        className="text-red-500 cursor-pointer"
                        data-testid={`delete-project-${project.project_id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {project.description && (
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {project.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.scan_types?.map((type) => (
                    <span
                      key={type}
                      className="px-2 py-1 text-xs rounded-sm capitalize"
                      style={{ 
                        backgroundColor: 'var(--primary-muted)', 
                        color: 'var(--primary)' 
                      }}
                    >
                      {type}
                    </span>
                  ))}
                </div>

                <div 
                  className="flex items-center justify-between pt-4 border-t text-xs"
                  style={{ borderColor: 'var(--border-divider)' }}
                >
                  <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Clock className="w-3 h-3" />
                    Last scan: {formatDate(project.last_scan_at)}
                  </div>
                  <div 
                    className="flex items-center gap-1"
                    style={{ 
                      color: project.status === 'active' ? 'var(--secure-text)' : 'var(--text-muted)' 
                    }}
                  >
                    <span className={`status-dot ${project.status === 'active' ? 'completed' : 'pending'}`}></span>
                    {project.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state py-20">
            <FolderGit2 className="empty-state-icon" />
            <h4 className="empty-state-title">No Projects Yet</h4>
            <p className="empty-state-text mb-6">
              Add your first project to start scanning for vulnerabilities
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="btn-primary rounded-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Project
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProjectsPage;
