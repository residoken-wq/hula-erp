import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { Milestone } from './entities/milestone.entity';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project) private repo: Repository<Project>,
        @InjectRepository(Milestone) private milestoneRepo: Repository<Milestone>,
    ) { }

    async findAll(user: any) {
        return this.repo.find({
            relations: ['manager', 'members'],
            order: { created_at: 'DESC' },
            where: [
                { manager_id: user.id },
                { members: { id: user.id } }
            ]
        });
    }

    async findOne(id: number, user?: any) {
        const project = await this.repo.findOne({
            where: { id },
            relations: ['manager', 'milestones', 'members', 'tasks', 'tasks.assignee']
        });
        if (!project) throw new NotFoundException('Project not found');

        // Check Access if user is provided
        if (user) {
            const isMember = project.members?.some(m => m.id === user.id);
            const isManager = project.manager_id === user.id;

            if (!isMember && !isManager) {
                throw new NotFoundException('Project not found or access denied');
            }
        }

        return project;
    }

    async create(data: any) {
        const { member_ids, ...rest } = data;
        const project = this.repo.create(rest);

        if (member_ids && member_ids.length > 0) {
            project.members = member_ids.map((id: number) => ({ id }));
        }

        return this.repo.save(project);
    }

    async update(id: number, data: any) {
        const { member_ids, ...rest } = data;
        const project = await this.repo.findOne({ where: { id } });

        if (member_ids) {
            project.members = member_ids.map((uid: number) => ({ id: uid }));
        }

        Object.assign(project, rest);
        await this.repo.save(project);
        return this.findOne(id, { id: project.manager_id }); // Return as manager/system
    }

    async remove(id: number) {
        return this.repo.delete(id);
    }

    // Milesstones
    async addMilestone(projectId: number, data: any) {
        const ms = this.milestoneRepo.create({
            project_id: projectId,
            ...data
        });
        await this.milestoneRepo.save(ms);
        return this.findOne(projectId);
    }

    async updateMilestone(id: number, data: any) {
        await this.milestoneRepo.update(id, data);
        const ms = await this.milestoneRepo.findOne({ where: { id } });
        return this.findOne(ms.project_id);
    }

    async removeMilestone(id: number) {
        const ms = await this.milestoneRepo.findOne({ where: { id } });
        if (ms) await this.milestoneRepo.delete(id);
        return { success: true };
    }
}
